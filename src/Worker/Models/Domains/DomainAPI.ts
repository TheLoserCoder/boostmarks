import DB from "../../DB/DB";
import { IDomains, ITags, ITagsAndDomainsRelations as ITADR } from "../../DB/TypesAndInterfaces";
import uniqid from 'uniqid';
import Domains from "./Domains";
import TADRAPI, { DIMWRTI } from "../Tags/TagsRelatedToDomains";
import Tags from "../Tags/Tags";

export interface IDomainWithDags extends IDomains{
    tags: ITags[];
}
export type DWT = IDomainWithDags;

export interface IDomainData{
    domain: string,
    tagsIds: string[]
}

class DomainsAPI{
    public async getDomains(): Promise<DWT[]>
    {
        let 
        domainsWithTags!: DWT[],
        domains:IDomains[],
        domainsIdsMap: DIMWRTI;
        const
        getDomains: Promise<IDomains[]> = Domains.getDomains(),
        getMap: Promise<DIMWRTI> = TADRAPI.getDomainsIdsMapWithRelatedTagsIds(),
        getTags = (tagsIds: string[]) : Promise<ITags[]> => 
        Tags.getTagsByIds(tagsIds),
        getDomainsWithTags = async (domain: IDomains, tagsIds: string[]) : Promise<DWT> => {
            const tags = await getTags(tagsIds);
            return {...domain, tags}
        }
        await DB.transaction('r',
        DB.Domains,
        DB.Tags,
        async() => {
            [domains, domainsIdsMap] = await Promise.all([getDomains, getMap]);
            domainsWithTags = await Promise.all(
                domains.map(
                    (domain: IDomains) : Promise<DWT> => 
                        getDomainsWithTags(domain, domainsIdsMap[domain.id])
                )
            )
        }
        )
        return domainsWithTags;
    }
    public async createDomain(domainData: IDomainData)
    {
        const id: string = uniqid();
        const
        domainIdWithRelatedTagsIds: ITADR[] =
        domainData.tagsIds.map((tagId:string) : ITADR => ({domainId: id, tagId}) );
        await DB.transaction('rw',
            DB.Domains,
            DB.TagsAndDomainsRelations,
            async ()=> {
                await Promise.all([
                    Domains.add({id, domain: domainData.domain}),
                    TADRAPI.add(domainIdWithRelatedTagsIds)
                ])
            }
        )
    }
    public async editDomain(_domain: DWT)
    {
        const tagsIds: string[] = _domain.tags.map((tag:ITags) => tag.id);
        const {id, domain} = _domain;
        await DB.transaction('rw',
            DB.Domains,
            DB.TagsAndDomainsRelations,
            async () => {
                await Promise.all(
                    [
                        Domains.edit({id, domain}),
                        TADRAPI.remove(tagsIds)
                    ]
                )
            }
        )
    }
    public async removeDomains(domainsIds: string[])
    {
        await DB.transaction('rw',
            DB.Domains,
            DB.TagsAndDomainsRelations,
            async () => {
                await Promise.all(
                    [
                        Domains.remove(domainsIds),
                        TADRAPI.remove(domainsIds)
                    ]
                )
            }
        )
    }
}

export default new DomainsAPI();