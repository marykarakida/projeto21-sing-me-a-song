import supertest from 'supertest';
import app from '../../src/app';
import { prisma } from '../../src/database';

import { deleteAllData, disconnectPrisma } from '../factories/scenarioFactory';
import * as recommendationFactory from '../factories/recommendationFactory';

const server = supertest(app);

describe('/recommendations', () => {
    beforeEach(async () => {
        await deleteAllData();
    });

    afterAll(async () => {
        await disconnectPrisma();
    });

    describe('POST /recommendations', () => {
        describe('given that input data is valid', () => {
            it('should insert a new recomendation and return status code 201', async () => {
                const validRecommendation = recommendationFactory.createValidRecommendation();

                const result = await server.post('/recommendations').send(validRecommendation);
                const createdRecommendation = await prisma.recommendation.findUnique({ where: { name: validRecommendation.name } });

                expect(result.status).toBe(201);
                expect(createdRecommendation).not.toBeNull();
            });
        });

        describe('given that youtube link does not match regex pattern', () => {
            it('should return status code 422', async () => {
                const invalidRecommendation = recommendationFactory.createInvalidRecommendation();

                const result = await server.post('/recommendations').send(invalidRecommendation);
                expect(result.status).toBe(422);
            });
        });

        describe('given that recommendation name was already taken', () => {
            it('should return status code 409', async () => {
                const validRecommendation = recommendationFactory.createValidRecommendation();
                await recommendationFactory.insertRecommendation(validRecommendation);

                const result = await server.post('/recommendations').send(validRecommendation);
                expect(result.status).toBe(409);
            });
        });
    });

    describe('POST /recommendations/:id/upvote', () => {
        describe('given that recommendation exists', () => {
            it('should increase score by 1 and return status code 200', async () => {
                const validRecommendation = recommendationFactory.createValidRecommendation();
                const insertedRecommendation = await recommendationFactory.insertRecommendation(validRecommendation);

                const result = await server.post(`/recommendations/${insertedRecommendation.id}/upvote`);
                const upvotedRecommendation = await prisma.recommendation.findUnique({ where: { id: insertedRecommendation.id } });

                expect(result.status).toBe(200);
                expect(upvotedRecommendation).not.toBeNull();
                expect(upvotedRecommendation.score).toBe(insertedRecommendation.score + 1);
            });
        });

        describe('given that recommendation does not exists', () => {
            it('should return status code 404', async () => {
                const result = await server.post(`/recommendations/0/upvote`);

                expect(result.status).toBe(404);
            });
        });
    });

    describe('POST /recommendations/:id/downvote', () => {
        describe('given that recommendation exists', () => {
            it('should decrease score by 1 and return status code 200', async () => {
                const validRecommendation = recommendationFactory.createValidRecommendation();
                const insertedRecommendation = await recommendationFactory.insertRecommendation(validRecommendation);

                const result = await server.post(`/recommendations/${insertedRecommendation.id}/downvote`);
                const downvotedRecommendation = await prisma.recommendation.findUnique({ where: { id: insertedRecommendation.id } });

                expect(result.status).toBe(200);
                expect(downvotedRecommendation).not.toBeNull();
                expect(downvotedRecommendation.score).toBe(insertedRecommendation.score - 1);
            });
        });

        describe('given that recommendation exists and has score less than -5', () => {
            it('should delete recomendation', async () => {
                const validRecommendation = recommendationFactory.createValidRecommendation();
                const insertedRecommendation = await recommendationFactory.insertUnpopularRecomendation(validRecommendation);

                const result = await server.post(`/recommendations/${insertedRecommendation.id}/downvote`);
                const downvotedRecommendation = await prisma.recommendation.findUnique({ where: { id: insertedRecommendation.id } });

                expect(result.status).toBe(200);
                expect(downvotedRecommendation).toBeNull();
            });
        });

        describe('given that recommendation does not exists', () => {
            it('should return status code 404', async () => {
                const result = await server.post(`/recommendations/0/downvote`);

                expect(result.status).toBe(404);
            });
        });
    });

    describe('GET /recommendations', () => {
        describe('given that no recommendation exists', () => {
            it('should return a empty and return status code 200', async () => {
                const result = await server.get(`/recommendations`);

                expect(result.status).toBe(200);
                expect(result.body.length).toBe(0);
            });
        });

        describe('given that more than 10 recommendation exists', () => {
            it('should return a list containing the 10 most recent recommendations and return status code 200', async () => {
                const recommendations = Array.from({ length: 11 }).map((_, index) => ({
                    id: index + 1,
                    score: 0,
                    ...recommendationFactory.createValidRecommendation(),
                }));
                await recommendationFactory.insertManyRecommendation(recommendations);

                const result = await server.get(`/recommendations`);

                expect(result.status).toBe(200);
                expect(result.body.length).toBe(10);
                expect(result.body).toEqual(recommendations.sort((a, b) => b.id - a.id).slice(0, 10));
            });
        });
    });

    describe('GET /recommendations/:id', () => {
        describe('given that the recommendation does exist', () => {
            it('should return the recommendation data object and return status code 200', async () => {
                const validRecommendation = recommendationFactory.createValidRecommendation();
                const insertedRecommendation = await recommendationFactory.insertRecommendation(validRecommendation);

                const result = await server.get(`/recommendations/${insertedRecommendation.id}`);

                expect(result.status).toBe(200);
                expect(result.body).toEqual(insertedRecommendation);
            });
        });

        describe('given that the recommendation does not exist', () => {
            it('should return status code 404', async () => {
                const result = await server.get('/recommendations/0');

                expect(result.status).toBe(404);
            });
        });
    });
});
