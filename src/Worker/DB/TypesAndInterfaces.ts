
export interface ITags {
    id: string,
    title: string,
 
 }
 
 export interface IDomains {
    id: string,
    domain: string,
 
 }
 
 //Tags and domains relations table
 export interface ITagsAndDomainsRelations {
    tagId: string,
    domainId: string
 }
 