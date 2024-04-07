import { Server } from "../../worker";
import TagsAPI, {ITagData, ITagWithDomains} from "./TagsAPI";
import { TagsEvents } from "../../../Tools/Events";
import { TagsIds } from "./Tags";

async function updateDomainsStore()
{
    const tags = await TagsAPI.getTags();
    Server.Tags.sendMessage(TagsEvents.updateTags, tags, false);
}

Server.Tags.on(TagsEvents.updateTags, () => {
    updateDomainsStore();
})

Server.Tags.on<ITagData>(TagsEvents.createtag, async ({data}) => {
    await TagsAPI.createTag(data)
    updateDomainsStore()
})

Server.Tags.on<ITagWithDomains>(TagsEvents.createtag, async ({data}) => {
    await TagsAPI.editTag(data);
    updateDomainsStore();
})

Server.Tags.on<TagsIds>(TagsEvents.createtag, async ({data}) => {
    await TagsAPI.removeTags(data);
    updateDomainsStore();
})