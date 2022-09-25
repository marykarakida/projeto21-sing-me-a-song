import { faker } from '@faker-js/faker';
import { Recommendation } from '@prisma/client';

import { prisma } from '../../src/database';

type TRecommendationInsertData = Omit<Recommendation, 'id' | 'score'>;

export function createInvalidRecommendation() {
    return { name: faker.music.songName(), youtubeLink: faker.internet.url() };
}

export function createValidRecommendation() {
    return { name: faker.music.songName(), youtubeLink: `https://www.youtube.com/watch?v=${faker.datatype.string}` };
}

export async function insertRecommendation(recommendation: TRecommendationInsertData): Promise<Recommendation> {
    return prisma.recommendation.create({ data: recommendation });
}
