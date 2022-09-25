import supertest from 'supertest';
import app from '../../src/app';

import { deleteAllData, disconnectPrisma } from '../factories/scenarioFactory';
import { createInvalidRecommendation, createValidRecommendation, insertRecommendation } from '../factories/recommendationFactory';

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
                const validRecommendation = createValidRecommendation();

                const result = await server.post('/recommendations').send(validRecommendation);
                expect(result.status).toBe(201);
            });
        });

        describe('given that youtube link does not match regex pattern', () => {
            it('should return status code 422', async () => {
                const invalidRecommendation = createInvalidRecommendation();

                const result = await server.post('/recommendations').send(invalidRecommendation);
                expect(result.status).toBe(422);
            });
        });

        describe('given that youtube link was already recommended previously', () => {
            it('should return status code 409', async () => {
                const validRecommendation = createValidRecommendation();
                await insertRecommendation(validRecommendation);

                const result = await server.post('/recommendations').send(validRecommendation);
                expect(result.status).toBe(409);
            });
        });
    });
});
