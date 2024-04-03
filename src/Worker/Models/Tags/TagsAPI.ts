import DB from "../../DB/DB";
import { ITags, ITagsAndDomainsRelations as ITADR } from "../../DB/TypesAndInterfaces";
import Tags from "./Tags";
import TagsAndDomainsRelationsAPI as TDApi from "./TagsRelatedToDomains";
import uniqid from 'uniqid';

//tags extended with domains
export interface ITagWithDomains extends ITags{
    domainsIds: string[];
}
export interface TagData{
    title: string,
    domainsIds: string[]
}
//alias
type TWD = ITagWithDomains;

export default class TagsAPI{
    public async createTag(tagData:TagData): Promise<void>
    {
        const id: string = uniqid();
        const tagIdWithRealtedDomainsIdsArr: ITADR[] = 
                tagData.domainsIds.map((domainId) : ITADR=> ({tagId: id, domainId}));
        await DB.transaction('rw', 
            DB.Tags,
            DB.TagsAndDomainsRelations,
            async () => {
                await Promise.all([
                    Tags.add({id, title: tagData.title}),
                    TDAPI
                ])
            }
        )
    }
   
}
