import Dexie from "dexie";
import DB from "../../DB/DB";
import { IDomains } from "../../DB/TypesAndInterfaces";
import isValidDomain from "is-valid-domain";
import Errors from "../../../Tools/Errors";

export type DomainsIDs = string[];

class Domains{
    private table: Dexie.Table<IDomains> = DB.Domains;

    private validate(domain: IDomains)
    {
        if(!isValidDomain(domain.domain)) throw new Error(Errors.Domains.Invalid);
    }
    public async add(domain: IDomains)
    {
        this.validate(domain);
        await this.table.add(domain);
    }
    public async edit(domain: IDomains)
    {
        this.validate(domain);
        await this.table.put(domain);
    }
    public async remove(domainsIds: DomainsIDs)
    {
        await this.table.bulkDelete(domainsIds);
    }
    public async getDomains(): Promise<IDomains[]>
    {
        return await this.table.toArray();
    }
    public async getDomainsByIds(domainsIds: DomainsIDs): Promise<IDomains[]> 
    {
        if(!domainsIds.length) return [];
        const res: (IDomains | any)[] =  await this.table.bulkGet(domainsIds);
        return res;
    }
}

export default new Domains();