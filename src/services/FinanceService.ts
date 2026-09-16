import { IFinanceRepository } from './contracts/IFinanceRepository';
import { MockFinanceRepository } from './adapters/MockFinanceRepository';

class FinanceServiceManager {
  private repository: IFinanceRepository;

  constructor(repo?: IFinanceRepository) {
    // Defaults to Mock in-memory adapter; can be swapped dynamically to SQLite WASM adapter
    this.repository = repo || new MockFinanceRepository();
  }

  public setRepository(repo: IFinanceRepository) {
    this.repository = repo;
  }

  public getRepo(): IFinanceRepository {
    return this.repository;
  }
}

export const FinanceService = new FinanceServiceManager();
