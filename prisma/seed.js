import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const categories = ["IT", "Социальные проекты", "Медиа", "Наука", "Лидерство", "Спорт", "Искусство"];
const cities = ["Москва", "Санкт-Петербург", "Казань", "Екатеринбург", "Новосибирск", "Томск", "Самара"];
const statuses = ["upcoming", "active", "completed", "draft", "cancelled"];

function getRank(points = 0) {
  if (points >= 6000) return "Diamond";
  if (points >= 3000) return "Platinum";
  if (points >= 1500) return "Gold";
  if (points >= 500) return "Silver";
  return "Bronze";
}

async function createUser({ fullName, email, password, role, city, bio, trustRating }) {
  const passwordHash = await bcrypt.hash(password, 10);

  return prisma.user.create({
    data: {
      fullName,
      email,
      passwordHash,
      role,
      isApproved: true,
      profile: {
        create: {
          city,
          bio,
          trustRating,
          rank: "Bronze",
        },
      },
    },
    include: { profile: true },
  });
}

async function syncProfile(userId) {
  const [verifiedParticipations, organizedEvents] = await Promise.all([
    prisma.participation.findMany({
      where: { participantId: userId, status: "verified" },
      select: { pointsEarned: true, eventCategorySnapshot: true },
    }),
    prisma.event.count({
      where: { organizerId: userId },
    }),
  ]);

  const totalPoints = verifiedParticipations.reduce((sum, item) => sum + (item.pointsEarned || 0), 0);
  const totalEvents = verifiedParticipations.length;
  const userCategories = [...new Set(verifiedParticipations.map((item) => item.eventCategorySnapshot).filter(Boolean))];

  await prisma.userProfile.update({
    where: { userId },
    data: {
      totalPoints,
      totalEvents,
      eventsOrganized: organizedEvents,
      categories: userCategories,
      rank: getRank(totalPoints),
    },
  });
}

async function main() {
  await prisma.feedback.deleteMany();
  await prisma.participation.deleteMany();
  await prisma.event.deleteMany();
  await prisma.userProfile.deleteMany();
  await prisma.user.deleteMany();

  const organizer = await createUser({
    fullName: "Организатор",
    email: "org@example.com",
    password: "12345678",
    role: "organizer",
    city: "Москва",
    bio: "Главный организатор платформы.",
    trustRating: 4.9,
  });

  const participant = await createUser({
    fullName: "Участник",
    email: "user@example.com",
    password: "12345678",
    role: "participant",
    city: "Казань",
    bio: "Активный участник молодежного парламента.",
    trustRating: 4.6,
  });

  const observer = await createUser({
    fullName: "Наблюдатель",
    email: "hr@example.com",
    password: "12345678",
    role: "observer",
    city: "Санкт-Петербург",
    bio: "Наблюдатель системы и аналитик рейтинга.",
    trustRating: 4.8,
  });

  const demoParticipants = [];
  for (let index = 1; index <= 20; index += 1) {
    const user = await createUser({
      fullName: `Участник ${index}`,
      email: `demo${index}@example.com`,
      password: "12345678",
      role: "participant",
      city: cities[index % cities.length],
      bio: `Тестовый участник №${index} для демонстрации работы рейтинга.`,
      trustRating: 4 + ((index % 10) / 10),
    });
    demoParticipants.push(user);
  }

  const eventBlueprints = [
    {
      title: "IT-хакатон молодежного парламента",
      description: "Командная работа над цифровыми сервисами для молодежных инициатив.",
      category: "IT",
      status: "completed",
      basePoints: 180,
      difficultyCoefficient: 1.6,
      location: "Москва",
    },
    {
      title: "Форум социальных проектов",
      description: "Презентация общественно значимых инициатив и практик.",
      category: "Социальные проекты",
      status: "active",
      basePoints: 120,
      difficultyCoefficient: 1.2,
      location: "Казань",
    },
    {
      title: "Медиашкола парламентской молодежи",
      description: "Обучение созданию контента и медиасопровождению мероприятий.",
      category: "Медиа",
      status: "upcoming",
      basePoints: 110,
      difficultyCoefficient: 1.1,
      location: "Санкт-Петербург",
    },
    {
      title: "Научная сессия молодых экспертов",
      description: "Подготовка аналитических материалов и исследовательских докладов.",
      category: "Наука",
      status: "completed",
      basePoints: 160,
      difficultyCoefficient: 1.5,
      location: "Новосибирск",
    },
    {
      title: "Школа лидерства и публичных выступлений",
      description: "Развитие управленческих и коммуникативных навыков.",
      category: "Лидерство",
      status: "active",
      basePoints: 140,
      difficultyCoefficient: 1.3,
      location: "Екатеринбург",
    },
    {
      title: "Спортивный фестиваль молодежного парламента",
      description: "Командные соревнования и спортивные активности.",
      category: "Спорт",
      status: "upcoming",
      basePoints: 100,
      difficultyCoefficient: 1.0,
      location: "Самара",
    },
    {
      title: "Фестиваль творческих инициатив",
      description: "Творческие проекты, культурные акции и художественные выступления.",
      category: "Искусство",
      status: "draft",
      basePoints: 115,
      difficultyCoefficient: 1.1,
      location: "Томск",
    },
  ];

  const now = new Date();
  const events = [];
  for (let index = 0; index < eventBlueprints.length; index += 1) {
    const blueprint = eventBlueprints[index];
    const date = new Date(now);
    date.setDate(now.getDate() + (index - 3) * 4);
    const endDate = new Date(date);
    endDate.setDate(date.getDate() + 1);

    const event = await prisma.event.create({
      data: {
        title: blueprint.title,
        description: blueprint.description,
        category: blueprint.category,
        status: blueprint.status,
        basePoints: blueprint.basePoints,
        difficultyCoefficient: blueprint.difficultyCoefficient,
        location: blueprint.location,
        date,
        endDate,
        maxParticipants: 80,
        bonusDescription: "Сертификат участника и дополнительные баллы за активность.",
        organizerId: organizer.id,
      },
    });
    events.push(event);
  }

  const allParticipants = [participant, ...demoParticipants];
  let verifiedCounter = 0;

  for (let eventIndex = 0; eventIndex < events.length; eventIndex += 1) {
    const event = events[eventIndex];
    const sliceStart = (eventIndex * 3) % allParticipants.length;
    const selectedParticipants = allParticipants
      .slice(sliceStart, sliceStart + 8)
      .concat(allParticipants.slice(0, Math.max(0, sliceStart + 8 - allParticipants.length)))
      .slice(0, 8);

    for (let participantIndex = 0; participantIndex < selectedParticipants.length; participantIndex += 1) {
      const currentParticipant = selectedParticipants[participantIndex];
      const isVerified = participantIndex < 5 && ["completed", "active"].includes(event.status);
      const isRejected = participantIndex === 7 && event.status === "completed";
      const points = isVerified ? Math.round(event.basePoints * event.difficultyCoefficient) : 0;

      await prisma.participation.create({
        data: {
          eventId: event.id,
          participantId: currentParticipant.id,
          status: isVerified ? "verified" : isRejected ? "rejected" : "pending",
          pointsEarned: points,
          eventTitleSnapshot: event.title,
          participantName: currentParticipant.fullName,
          participantEmail: currentParticipant.email,
          eventDateSnapshot: event.date,
          eventCategorySnapshot: event.category,
          difficultyCoefficient: event.difficultyCoefficient,
          verifiedById: isVerified || isRejected ? organizer.id : null,
          verifiedAt: isVerified || isRejected ? new Date(event.date) : null,
        },
      });

      if (isVerified) {
        verifiedCounter += 1;
      }
    }
  }

  for (const user of [organizer, participant, observer, ...demoParticipants]) {
    await syncProfile(user.id);
  }

  console.log("Seed complete");
  console.log(`Users created: ${3 + demoParticipants.length}`);
  console.log(`Events created: ${events.length}`);
  console.log(`Verified participations: ${verifiedCounter}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
