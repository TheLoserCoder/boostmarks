import Dexie from "dexie";
import DB from "../../DB/DB";
import { ITags } from "../../DB/TypesAndInterfaces";
import Errors from "../../../Tools/Errors";

export type TagsIds = string[];

 class Tags{
    private table: Dexie.Table<ITags> = DB.Tags;

    private validate(tag: ITags):void
    {
        if(!tag.title) throw new Error(Errors.Tags.Untitled);
    }
    public async add(tag: ITags): Promise<void>
    {
        this.validate(tag);
        await this.table.add(tag);
    }
    public async edit(tag: ITags): Promise<void>
    {
        this.validate(tag);
        await this.table.put(tag);
    }
    public async remove(tagsIds: TagsIds): Promise<void>
    {
        await this.table.bulkDelete(tagsIds);
    }
    public async getTags(): Promise<ITags[]>
    {
        return await this.table.toArray();
    }
    public async getTagsByIds(tagsIds: TagsIds): Promise<ITags[] | any[]> 
    {
        if(!tagsIds.length) return [];
        return await this.table.bulkGet(tagsIds);
    }
}

export default new Tags();