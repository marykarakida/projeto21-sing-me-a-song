import * as e2eRepository from '../repositories/e2eRepository';

export async function truncate() {
    await e2eRepository.truncate();
}
