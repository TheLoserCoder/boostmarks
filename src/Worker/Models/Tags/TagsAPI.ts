import DB from "../../DB/DB";
import { ITags, ITagsAndDomainsRelations as ITADR, IDomains } from "../../DB/TypesAndInterfaces";
import Domains from "../Domains/Domains";
import Tags from "./Tags";
import TADRAPI, {TIMWRDI}from "./TagsRelatedToDomains"; 
import uniqid from 'uniqid';

//tags extended with domains
export interface ITagWithDomains extends ITags{
    domains: IDomains[];
}
export interface ITagData{
    title: string,
    domainsIds: string[]
}
//alias
export type TWD = ITagWithDomains;

export default class TagsAPI{
    public subscribe(callback: () => void)
    {

    }
    public async getTags(): Promise<TWD[]>
    {
        let 
        tagsWidtDomains!: TWD[],
        tags:ITags[],
        tagsIdsMap: TIMWRDI;
        const 
        getTags: Promise<ITags[]> = Tags.getTags(),
        getMap: Promise<TIMWRDI> = TADRAPI.getTagsIdsMapWithRelatedDomainsIds(),
        getDomains = 
        (domainsIds: string[]) : Promise<IDomains[]> => 
        Domains.getDomainsByIds(domainsIds),
        getTagWithDomains = async (tag: ITags, domainsIds: string[]) : Promise<TWD> => {
            const domains = await getDomains(domainsIds);
            return {...tag, domains}
        };
        await DB.transaction('r',
            DB.Tags,
            DB.Domains,
            async() => {
                [tags, tagsIdsMap] = await Promise.all([getTags, getMap]);
                tagsWidtDomains = await Promise.all(
                    tags.map((tag: ITags) :  Promise<TWD>  => 
                    getTagWithDomains(tag, tagsIdsMap[tag.id]))
                )
            }
        )
        return tagsWidtDomains;
    }
    public async createTag(tagData:ITagData): Promise<void>
    {
        const id: string = uniqid();
        const 
        tagIdWithRelatedDomainsIds: ITADR[] = 
        tagData.domainsIds.map((domainId: string) : ITADR=> ({tagId: id, domainId}));
        await DB.transaction('rw', 
            DB.Tags,
            DB.TagsAndDomainsRelations,
            async () => {
                await Promise.all([
                    Tags.add({id, title: tagData.title}),
                    TADRAPI.add(tagIdWithRelatedDomainsIds)
                ])
            }
        )
    }
    public async editTag(tag:TWD): Promise<void>
    {
        const domainsIds: string[] = tag.domains.map((domain: IDomains) => domain.id);
        const {id, title} = tag;
        await DB.transaction('rw', 
            DB.Tags,
            DB.TagsAndDomainsRelations,
            async () => {
                await Promise.all(
                    [
                        Tags.edit({id, title}),
                        TADRAPI.editTag(id, domainsIds)
                    ]
                )
               
            }
        )
    }
    public async removeTags(tagsIds: string[])
    {
        await DB.transaction('rw',
            DB.Tags,
            DB.TagsAndDomainsRelations,
            async () => {
                await Promise.all(
                    [
                        Tags.remove(tagsIds),
                        TADRAPI.remove(tagsIds)
                    ]
                )
            }
        )
    }
   
}
