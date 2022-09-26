import { faker } from '@faker-js/faker';
import { Recommendation } from '@prisma/client';

import { prisma } from '../../src/database';

type TRecommendationInsertData = Omit<Recommendation, 'id' | 'score'>;

export function createInvalidRecommendation(): TRecommendationInsertData {
    return { name: faker.music.songName(), youtubeLink: faker.internet.url() };
}

export function createValidRecommendation(): TRecommendationInsertData {
    return { name: faker.music.songName(), youtubeLink: `https://www.youtube.com/watch?v=${faker.datatype.string()}` };
}

export function getCreatedRecommendation(recommendationData: TRecommendationInsertData, score: number = 0): Recommendation {
    return { id: faker.datatype.number(), score, ...recommendationData };
}

export function getRandomRecommendations(length: number) {
    const recommendations = Array.from({ length }).map((_, index) => ({
        id: index + 1,
        score: index % 2 === 0 ? faker.datatype.number({ min: -5, max: 10 }) : faker.datatype.number({ min: 11 }),
        ...createValidRecommendation(),
    }));

    return recommendations;
}

export async function insertRecommendation(recommendation: TRecommendationInsertData): Promise<Recommendation> {
    return prisma.recommendation.create({ data: recommendation });
}

export async function insertUnpopularRecomendation(recommendation: TRecommendationInsertData): Promise<Recommendation> {
    return prisma.recommendation.create({ data: { ...recommendation, score: -5 } });
}

export async function insertManyRecommendation(recomendations: Recommendation[]) {
    await prisma.recommendation.createMany({ data: recomendations });
}
