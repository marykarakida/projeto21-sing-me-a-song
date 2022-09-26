import { jest } from '@jest/globals';

import { recommendationService } from '../../src/services/recommendationsService';
import { recommendationRepository } from '../../src/repositories/recommendationRepository';
import * as recommendationFactory from '../factories/recommendationFactory';
import { faker } from '@faker-js/faker';

describe('recommendation service', () => {
    beforeEach(async () => {
        jest.clearAllMocks();
        jest.resetAllMocks();
    });

    describe('insert fn', () => {
        describe('given that recommendation data is valid', () => {
            it('should create a new recommendation', async () => {
                const validRecommendation = recommendationFactory.createValidRecommendation();

                jest.spyOn(recommendationRepository, 'findByName').mockResolvedValueOnce(null);
                jest.spyOn(recommendationRepository, 'create').mockResolvedValueOnce(null);

                await recommendationService.insert(validRecommendation);

                expect(recommendationRepository.findByName).toBeCalledTimes(1);
                expect(recommendationRepository.create).toBeCalledTimes(1);

                expect(recommendationRepository.findByName).toBeCalledWith(validRecommendation.name);
                expect(recommendationRepository.create).toBeCalledWith(validRecommendation);
            });
        });

        describe('given that recommendation name was already taken', () => {
            it('should not allow to create duplicated recommendation', async () => {
                const validRecommendation = recommendationFactory.createValidRecommendation();
                const existingRecommendation = recommendationFactory.getCreatedRecommendation(validRecommendation);

                jest.spyOn(recommendationRepository, 'findByName').mockResolvedValueOnce(existingRecommendation);
                jest.spyOn(recommendationRepository, 'create').mockResolvedValueOnce(null);

                const promise = recommendationService.insert(validRecommendation);

                expect(recommendationRepository.findByName).toBeCalledTimes(1);
                expect(recommendationRepository.create).not.toBeCalled();

                expect(recommendationRepository.findByName).toBeCalledWith(validRecommendation.name);

                expect(promise).rejects.toEqual({ type: 'conflict', message: 'Recommendations names must be unique' });
            });
        });
    });

    describe('upvote fn', () => {
        describe('given that an existing recommendation is upvoted', () => {
            it("should increase recommendation's score by 1", async () => {
                const validRecommendation = recommendationFactory.createValidRecommendation();
                const existingRecommendation = recommendationFactory.getCreatedRecommendation(validRecommendation);

                jest.spyOn(recommendationRepository, 'find').mockResolvedValueOnce(existingRecommendation);
                jest.spyOn(recommendationRepository, 'updateScore').mockResolvedValue({
                    ...existingRecommendation,
                    score: existingRecommendation.score + 1,
                });

                await recommendationService.upvote(existingRecommendation.id);

                expect(recommendationRepository.find).toBeCalledTimes(1);
                expect(recommendationRepository.updateScore).toBeCalledTimes(1);

                expect(recommendationRepository.find).toBeCalledWith(existingRecommendation.id);
                expect(recommendationRepository.updateScore).toBeCalledWith(existingRecommendation.id, 'increment');
            });
        });

        describe('given that a non existing recommendation is upvoted', () => {
            it('should not allow to upvote', async () => {
                jest.spyOn(recommendationRepository, 'find').mockResolvedValueOnce(null);
                jest.spyOn(recommendationRepository, 'updateScore');

                const promise = recommendationService.upvote(0);

                expect(recommendationRepository.find).toBeCalledTimes(1);
                expect(recommendationRepository.updateScore).not.toBeCalled();

                expect(recommendationRepository.find).toHaveBeenCalledWith(0);
                expect(promise).rejects.toEqual({ type: 'not_found', message: '' });
            });
        });
    });

    describe('downvote fn', () => {
        describe('given that an existing recommendation is downvoted', () => {
            it("should decrease recommendation's score by 1", async () => {
                const validRecommendation = recommendationFactory.createValidRecommendation();
                const existingRecommendation = recommendationFactory.getCreatedRecommendation(validRecommendation);

                jest.spyOn(recommendationRepository, 'find').mockResolvedValueOnce(existingRecommendation);
                jest.spyOn(recommendationRepository, 'updateScore').mockResolvedValueOnce({
                    ...existingRecommendation,
                    score: existingRecommendation.score - 1,
                });
                jest.spyOn(recommendationRepository, 'remove').mockResolvedValueOnce(null);

                await recommendationService.downvote(existingRecommendation.id);

                expect(recommendationRepository.find).toBeCalledTimes(1);
                expect(recommendationRepository.updateScore).toBeCalledTimes(1);
                expect(recommendationRepository.remove).not.toBeCalled();

                expect(recommendationRepository.find).toHaveBeenCalledWith(existingRecommendation.id);
                expect(recommendationRepository.updateScore).toBeCalledWith(existingRecommendation.id, 'decrement');
            });
        });

        describe('given that a non existing recommendation is downvoted', () => {
            it('should not allow to downvote', async () => {
                jest.spyOn(recommendationRepository, 'find').mockResolvedValueOnce(null);
                jest.spyOn(recommendationRepository, 'updateScore');
                jest.spyOn(recommendationRepository, 'remove');

                const promise = recommendationService.downvote(0);

                expect(recommendationRepository.find).toBeCalledTimes(1);
                expect(recommendationRepository.updateScore).not.toBeCalled();
                expect(recommendationRepository.remove).not.toBeCalled();

                expect(recommendationRepository.find).toHaveBeenCalledWith(0);

                expect(promise).rejects.toEqual({ type: 'not_found', message: '' });
            });
        });

        describe('given that a recommendation with less than -5 score is downvoted', () => {
            it('should delete the recommendation', async () => {
                const validRecommendation = recommendationFactory.createValidRecommendation();
                const existingRecommendation = recommendationFactory.getCreatedRecommendation(validRecommendation, -5);

                jest.spyOn(recommendationRepository, 'find').mockResolvedValueOnce(existingRecommendation);
                jest.spyOn(recommendationRepository, 'updateScore').mockResolvedValueOnce({
                    ...existingRecommendation,
                    score: existingRecommendation.score - 1,
                });
                jest.spyOn(recommendationRepository, 'remove');

                await recommendationService.downvote(existingRecommendation.id);

                expect(recommendationRepository.find).toBeCalledTimes(1);
                expect(recommendationRepository.updateScore).toBeCalledTimes(1);
                expect(recommendationRepository.remove).toBeCalledTimes(1);

                expect(recommendationRepository.find).toHaveBeenCalledWith(existingRecommendation.id);
                expect(recommendationRepository.updateScore).toBeCalledWith(existingRecommendation.id, 'decrement');
                expect(recommendationRepository.remove).toBeCalledWith(existingRecommendation.id);
            });
        });
    });

    describe('get fn', () => {
        describe('given that recommendations exist', () => {
            it('should return a list with recomendations', async () => {
                const recommendations = Array.from({ length: 10 }).map((_, index) => ({
                    id: index + 1,
                    score: 0,
                    ...recommendationFactory.createValidRecommendation(),
                }));

                jest.spyOn(recommendationRepository, 'findAll').mockResolvedValueOnce(recommendations);

                const result = await recommendationService.get();

                expect(recommendationRepository.findAll).toBeCalledTimes(1);

                expect(recommendationRepository.findAll).toBeCalledWith();

                expect(result).toEqual(recommendations);
            });
        });
    });

    describe('getById fn', () => {
        describe('given that the recommendation does exist', () => {
            it('should return the recommendation', async () => {
                const validRecommendation = recommendationFactory.createValidRecommendation();
                const existingRecommendation = recommendationFactory.getCreatedRecommendation(validRecommendation);

                jest.spyOn(recommendationRepository, 'find').mockResolvedValueOnce(existingRecommendation);

                const result = await recommendationService.getById(existingRecommendation.id);

                expect(recommendationRepository.find).toBeCalledTimes(1);

                expect(recommendationRepository.find).toBeCalledWith(existingRecommendation.id);

                expect(result).toEqual(existingRecommendation);
            });
        });
    });

    describe('getRandom fn', () => {
        describe("given that there are musics with score greater and less than 10 and 'random' is less than 0.7", () => {
            it('should return a random music with score greater than 10', async () => {
                const randomRecommendations = recommendationFactory.getRandomRecommendations(4);

                jest.spyOn(Math, 'random').mockReturnValue(faker.datatype.number({ max: 0.6, precision: 0.1 }));
                jest.spyOn(recommendationRepository, 'findAll').mockResolvedValueOnce(
                    randomRecommendations.filter(({ id }) => id % 2 === 0)
                );

                const result = await recommendationService.getRandom();

                expect(recommendationRepository.findAll).toBeCalledTimes(1);

                expect(recommendationRepository.findAll).toBeCalledWith({ score: 10, scoreFilter: 'gt' });

                expect(randomRecommendations).toContainEqual(result);

                expect(result.score).toBeGreaterThan(10);
            });
        });

        describe("given that there are musics with score greater and less than 10 and 'random' is greater than 0.7", () => {
            it('should return a random music with score less or equal than 10', async () => {
                const randomRecommendations = recommendationFactory.getRandomRecommendations(4);

                jest.spyOn(Math, 'random').mockReturnValue(faker.datatype.number({ min: 0.8, max: 1, precision: 0.1 }));
                jest.spyOn(recommendationRepository, 'findAll').mockResolvedValueOnce(
                    randomRecommendations.filter(({ id }) => id % 2 === 1)
                );

                const result = await recommendationService.getRandom();

                expect(recommendationRepository.findAll).toBeCalledTimes(1);

                expect(recommendationRepository.findAll).toBeCalledWith({ score: 10, scoreFilter: 'lte' });

                expect(randomRecommendations).toContainEqual(result);

                expect(result.score).toBeLessThanOrEqual(10);
            });
        });

        describe('given that there are only music recommendations greater than 10 or music recommendations less or equal than 10', () => {
            it('should return a random music', async () => {
                const remainder = faker.datatype.number(1);
                const randomRecommendations = recommendationFactory.getRandomRecommendations(4);
                jest.spyOn(Math, 'random').mockReturnValue(faker.datatype.number({ max: 1, precision: 0.1 }));
                jest.spyOn(recommendationRepository, 'findAll').mockResolvedValueOnce([]);
                jest.spyOn(recommendationRepository, 'findAll').mockResolvedValueOnce(
                    randomRecommendations.filter(({ id }) => id % 2 === remainder)
                );

                const result = await recommendationService.getRandom();

                expect(recommendationRepository.findAll).toBeCalledTimes(2);

                expect(randomRecommendations).toContainEqual(result);
            });
        });

        describe('given that there are no music recommendations', () => {
            it('should throw a not found error', async () => {
                jest.spyOn(Math, 'random').mockReturnValue(faker.datatype.number({ max: 1, precision: 0.1 }));
                jest.spyOn(recommendationRepository, 'findAll').mockResolvedValue([]);

                const result = recommendationService.getRandom();

                expect(recommendationRepository.findAll).toBeCalledTimes(1);

                expect(result).rejects.toEqual({ type: 'not_found', message: '' });
            });
        });
    });

    describe('getTop fn', () => {
        describe('given that there are music recommendations', () => {
            it('should return the recommendation', async () => {
                const amount = faker.datatype.number(4);
                const randomRecommendations = recommendationFactory.getRandomRecommendations(4);

                jest.spyOn(recommendationRepository, 'getAmountByScore').mockResolvedValueOnce(
                    randomRecommendations.sort((a, b) => b.id - a.id).slice(0, amount)
                );

                const result = await recommendationService.getTop(amount);

                expect(recommendationRepository.getAmountByScore).toBeCalledTimes(1);

                expect(recommendationRepository.getAmountByScore).toBeCalledWith(amount);

                expect(result).toHaveLength(amount);
            });
        });
    });
});
