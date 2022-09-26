import { faker } from '@faker-js/faker';

describe('test recommendations', () => {
    beforeEach(() => {
        cy.resetDatabase();
    });

    context('POST /recommendations', () => {
        it('should create a new music recommendation', () => {
            const recommendation = {
                name: faker.music.songName(),
                youtubeLink: `https://www.youtube.com/watch?v=${faker.datatype.string()}`,
            };

            cy.visit('/');

            cy.get('input[data-cy=recommendation-name]').type(recommendation.name).should('have.value', recommendation.name);
            cy.get('input[data-cy=recommendation-youtube-link]')
                .type(recommendation.youtubeLink)
                .should('have.value', recommendation.youtubeLink);

            cy.intercept('POST', '/recommendations').as('createRecommendation');

            cy.get('button[data-cy=create-recommendation]').click();

            cy.wait('@createRecommendation');

            cy.contains(recommendation.name).should('be.visible');
        });

        it('should alert the user if recommendation name was already used', () => {
            const recommendation = {
                name: faker.music.songName(),
                youtubeLink: `https://www.youtube.com/watch?v=${faker.datatype.string()}`,
            };

            cy.createRecommendation(recommendation);

            cy.visit('/');

            cy.contains(recommendation.name).should('be.visible');

            cy.get('input[data-cy=recommendation-name]').type(recommendation.name).should('have.value', recommendation.name);
            cy.get('input[data-cy=recommendation-youtube-link]')
                .type(recommendation.youtubeLink)
                .should('have.value', recommendation.youtubeLink);

            cy.intercept('POST', '/recommendations').as('createRecommendation');

            cy.get('button[data-cy=create-recommendation]').click();

            cy.wait('@createRecommendation');

            cy.on('window:alert', (t) => {
                expect(t).to.contains('Error creating recommendation!');
            });
        });
    });

    context('POST /recommendations/:id/upvote', () => {
        it('should upvote a recommendation', () => {
            const recommendation = {
                name: faker.music.songName(),
                youtubeLink: `https://www.youtube.com/watch?v=${faker.datatype.string()}`,
            };

            cy.visit('/');

            cy.createRecommendation(recommendation);

            cy.intercept('GET', '/recommendations').as('getRecommendations');
            cy.wait('@getRecommendations');
            cy.contains(recommendation.name).should('be.visible');

            cy.intercept('POST', '/recommendations/1/upvote').as('upvoteRecommendation');
            cy.get('svg[data-cy=upvote-recommendation]').click();
            cy.wait('@upvoteRecommendation');

            cy.get('div[data-cy=recommendation-score]').should('have.text', '1');
        });
    });

    context('POST /recommendations/:id/downvote', () => {
        it('should downvote a recommendation', () => {
            const recommendation = {
                name: faker.music.songName(),
                youtubeLink: `https://www.youtube.com/watch?v=${faker.datatype.string()}`,
            };

            cy.createRecommendation(recommendation);

            cy.visit('/');

            cy.intercept('GET', '/recommendations').as('getRecommendations');
            cy.wait('@getRecommendations');
            cy.contains(recommendation.name).should('be.visible');

            cy.intercept('POST', '/recommendations/1/downvote').as('downvoteRecommendation');
            cy.get('svg[data-cy=downvote-recommendation]').click();
            cy.wait('@downvoteRecommendation');

            cy.get('div[data-cy=recommendation-score]').should('have.text', '-1');
        });

        it('should delete a recommendation if score is less than -5', () => {
            const recommendation = {
                name: faker.music.songName(),
                youtubeLink: `https://www.youtube.com/watch?v=${faker.datatype.string()}`,
            };

            cy.createAndDownvoteRecommendation(recommendation);

            cy.visit('/');

            cy.intercept('GET', '/recommendations').as('getRecommendations');
            cy.wait('@getRecommendations');
            cy.contains(recommendation.name).should('be.visible');

            cy.intercept('POST', '/recommendations/1/downvote').as('downvoteRecommendation');
            cy.get('svg[data-cy=downvote-recommendation]').click();
            cy.wait('@downvoteRecommendation');

            cy.contains(recommendation.name).should('not.exist');
        });
    });

    context('GET /recommendations', () => {
        it('should retrieve at most 10 most recent music recommendations', () => {
            const recommendations = Array.from({ length: 11 }).map(() => ({
                name: faker.music.songName(),
                youtubeLink: `https://www.youtube.com/watch?v=${faker.datatype.string()}`,
            }));

            recommendations.forEach((item) => {
                cy.createRecommendation(item);
            });

            cy.visit('/');

            cy.intercept('GET', '/recommendations').as('getRecommendations');
            cy.wait('@getRecommendations');

            recommendations.forEach((item, index) => {
                if (index === 0) return;
                cy.contains(item.name).should('be.visible');
            });
        });
    });

    context('GET /recommendations/random', () => {
        it('should retrieve a random recomendation', () => {
            const recommendation = {
                name: faker.music.songName(),
                youtubeLink: `https://www.youtube.com/watch?v=${faker.datatype.string()}`,
            };

            cy.createRecommendation(recommendation);

            cy.visit('/random');

            cy.intercept('GET', '/recommendations/random').as('getRandomRecommendation');
            cy.wait('@getRandomRecommendation');

            cy.contains(recommendation.name).should('be.visible');
        });
    });

    context('GET /recommendations/top/:amount', () => {
        it('should retrieve at most 10 recent music recommendations', () => {
            const recommendations = Array.from({ length: 10 }).map(() => ({
                name: faker.music.songName(),
                youtubeLink: `https://www.youtube.com/watch?v=${faker.datatype.string()}`,
            }));

            recommendations.forEach((item) => {
                cy.createRecommendation(item);
            });

            cy.visit('/top');

            cy.intercept('GET', '/recommendations/top/10').as('getTopRecommendations');
            cy.wait('@getTopRecommendations');

            recommendations.forEach((item, index) => {
                cy.contains(item.name).should('be.visible');
            });
        });
    });
});
