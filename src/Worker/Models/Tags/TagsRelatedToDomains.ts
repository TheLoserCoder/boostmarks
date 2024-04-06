//Model for related domains and tags table
import Dexie from "dexie";
import DB from "../../DB/DB";
import { ITagsAndDomainsRelations as ITADR } from "../../DB/TypesAndInterfaces";
//Tags ids map with related domains ids;
export interface  ITagsIdsMapWithRelatedDomainsIds{
  [tagId: string] : string[];
}
export interface DomainsIdsMapWithRelatedTagsIds{
    [domainId: string] : string[];
}
//aliases 
export type TIMWRDI = ITagsIdsMapWithRelatedDomainsIds;
export type DIMWRTI = DomainsIdsMapWithRelatedTagsIds;

class TagsAndDomainsRelationsAPI{
    private table: Dexie.Table<ITADR> = DB.TagsAndDomainsRelations;

    private async toArray() : Promise<ITADR[]>
    {
        return await this.table.toArray();
    }

    public async add( TADRArray: ITADR[]): Promise<void>
    {
        if(!TADRArray.length) return;
        await this.table.bulkAdd(TADRArray);
    }

    public async editTag(tagId: string, domainsIds: string[]): Promise<void>
    {
        await this.table
            .where({tagId})
            .filter((val: ITADR) => !domainsIds.includes(val.domainId))
            .delete();
    }

    public async editDomain(domainId: string, tagsIds: string[]): Promise<void>
    {
        await this.table
            .where({domainId})
            .filter((val: ITADR) => !tagsIds.includes(val.tagId))
            .delete();
    }

    public async remove(ids: string[]): Promise<void>
    {
        if(!ids.length) return;
        await this.table.bulkDelete(ids);
    }

    public async getTagsIdsMapWithRelatedDomainsIds(): Promise<TIMWRDI>
    {
        const TADRArray: ITADR[] = await this.toArray();
        const map: TIMWRDI = {};
        TADRArray.forEach( (val: ITADR) => {
            if(map[val.tagId]){
                map[val.tagId].push(val.domainId); 
            } else {
                map[val.tagId] = [val.domainId];
            }
        })
        return map;
    }

    public async getDomainsIdsMapWithRelatedTagsIds(): Promise<DIMWRTI>
    {
        const TADRArray: ITADR[] = await this.toArray();
        const map: DIMWRTI = {};
        TADRArray.forEach( (val: ITADR) => {
            if(map[val.domainId]){
                map[val.domainId].push(val.domainId); 
            } else {
                map[val.domainId] = [val.domainId];
            }
        })
        return map;
    }
}

export default new TagsAndDomainsRelationsAPI();