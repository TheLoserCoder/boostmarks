import Dexie from "dexie";
import { ITags, IDomains, ITagsAndDomainsRelations } from "./TypesAndInterfaces";

class DB extends Dexie{

   public Tags!: Dexie.Table<ITags>;
   public Domains!: Dexie.Table<IDomains>;
   public TagsAndDomainsRelations!: Dexie.Table<ITagsAndDomainsRelations>;

   constructor(){
      super("BoostmarksDB");

      this.version(1).stores({
         Tags: "id, title",
         Domains: "id, domain",
         TagsAndDomainsRelations: "tagId, domainId"
      });
      
   }
}

export default new DB();