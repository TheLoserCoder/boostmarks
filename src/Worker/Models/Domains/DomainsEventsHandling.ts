import { Server } from "../../worker";
import DomainAPI, {IDomainData, IDomainWithTags} from "./DomainAPI";
import {DomainsEvents} from "../../../Tools/Events"
import { DomainsIDs } from "./Domains";

async function updateDomainsStore()
{
    const domains = await DomainAPI.getDomains();
    Server.Domains.sendMessage(DomainsEvents.updateDomains, domains, false);
}

Server.Domains.on(DomainsEvents.updateDomains, () => {
    updateDomainsStore();
})

Server.Domains.on<IDomainData>(DomainsEvents.createDomain, async ({data}) => {
    await DomainAPI.createDomain(data);
    updateDomainsStore()
})

Server.Domains.on<IDomainWithTags>(DomainsEvents.editDomain, async ({data}) => {
    await DomainAPI.editDomain(data);
    updateDomainsStore();
})

Server.Domains.on<DomainsIDs>(DomainsEvents.removeDomains, async ({data}) => {
    await DomainAPI.removeDomains(data);
    updateDomainsStore();
})