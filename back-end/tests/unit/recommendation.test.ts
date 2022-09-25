import { jest } from '@jest/globals';

import { recommendationService } from '../../src/services/recommendationsService';
import { recommendationRepository } from '../../src/repositories/recommendationRepository';
import { createValidRecommendation, insertRecommendation } from '../factories/recommendationFactory';

describe('recommendation service', () => {
    beforeEach(async () => {
        jest.clearAllMocks();
        jest.resetAllMocks();
    });

    describe('insert fn', () => {
        describe('given that recommendation data is valid', () => {
            it('should create a new recommendation', async () => {
                const validRecommendation = createValidRecommendation();

                jest.spyOn(recommendationRepository, 'findByName').mockResolvedValueOnce(null);
                jest.spyOn(recommendationRepository, 'create').mockResolvedValueOnce(null);

                recommendationService.insert(validRecommendation);

                expect(recommendationRepository.findByName).toBeCalledTimes(1);
                expect(recommendationRepository.findByName).toBeCalledTimes(1);
            });
        });

        describe('given that youtube link was already recommended previously', () => {
            it('should not allow to create duplicated recommendation', async () => {
                const validRecommendation = createValidRecommendation();
                const insertedRecommendation = await insertRecommendation(validRecommendation);

                jest.spyOn(recommendationRepository, 'findByName').mockResolvedValueOnce(insertedRecommendation);

                const promise = recommendationService.insert(validRecommendation);

                expect(recommendationRepository.findByName).toBeCalledTimes(1);
                expect(recommendationRepository.create).not.toBeCalled();
                expect(promise).rejects.toEqual({ type: 'conflict', message: 'Recommendations names must be unique' });
            });
        });
    });
});
