import { BigInt } from "@graphprotocol/graph-ts";
import {
  NilERC721FactoryV2,
  Created,
} from "../generated/NilERC721FactoryV2/NilERC721FactoryV2";
import { NilCollection } from "../generated/schema";
import { NilERC721TemplateV1 } from "../generated/templates/NilERC721TemplateV1/NilERC721TemplateV1";
import { NilERC721TemplateV1 as NilERC721TemplateV1Template } from "../generated/templates";

export function handleCreated(event: Created): void {
  // Entities can be loaded from the store using a string ID; this ID
  // needs to be unique across all entities of the same type
  let collection = NilCollection.load(event.params.clone);

  // Entities only exist after they have been saved to the store;
  // `null` checks allow to create entities on demand
  if (!collection) {
    collection = new NilCollection(event.params.clone);
  }

  let factoryContract = NilERC721FactoryV2.bind(event.address);
  let tokenContract = NilERC721TemplateV1.bind(event.params.clone);

  collection.template = factoryContract.nftImplementation();
  collection.count = event.params.nftContractIdCounter;
  collection.name = tokenContract.name();
  collection.symbol = tokenContract.symbol();
  collection.numTokens = BigInt.zero();

  // Entities can be written to the store with `.save()`
  collection.save();

  NilERC721TemplateV1Template.create(event.params.clone);
}
