import { Address, BigInt, Bytes } from "@graphprotocol/graph-ts";
import { NilCollection, Owner, Token } from "../generated/schema";
import {
  NilERC721TemplateV1,
  Transfer,
} from "../generated/templates/NilERC721TemplateV1/NilERC721TemplateV1";

const ZERO_ADDRESS = Bytes.fromHexString(
  "0x0000000000000000000000000000000000000000"
);

export function handleTransfer(event: Transfer): void {
  let token = Token.load(tokenId(event.address, event.params.tokenId));

  if (event.params.from.equals(ZERO_ADDRESS)) {
    // Mint Transaction
    // Create new Token

    token = handleMint(event);
  } else {
    // Regular Transfer
    // Update old owner numTokens field

    let oldOwner = Owner.load(event.params.from);
    if (!oldOwner)
      throw new Error(`Old owner not found; ${event.transaction.hash}`);

    oldOwner.numTokens = oldOwner.numTokens.minus(BigInt.fromI32(1));

    oldOwner.save();
  }

  if (!token) throw new Error(`Token not found; ${event.transaction.hash}`);

  // Update new owner's numTokens field and set them on the token
  let newOwner = Owner.load(event.params.to);
  if (!newOwner) {
    newOwner = new Owner(event.params.to);
    newOwner.numTokens = BigInt.zero();
  }

  newOwner.numTokens = newOwner.numTokens.plus(BigInt.fromI32(1));

  token.owner = event.params.to;

  newOwner.save();
  token.save();
}

function handleMint(event: Transfer): Token {
  let token = new Token(tokenId(event.address, event.params.tokenId));
  let collection = NilCollection.load(event.address);
  if (!collection)
    throw new Error(`Collection not found ${event.transaction.hash}`);

  const contract = NilERC721TemplateV1.bind(event.address);

  let owner = Owner.load(event.params.to);
  if (!owner) {
    owner = new Owner(event.params.to);
    owner.numTokens = BigInt.zero();
  }

  owner.numTokens = owner.numTokens.plus(BigInt.fromI32(1));

  token.collection = event.address;
  token.tokenID = event.params.tokenId;
  token.owner = event.params.to;
  token.mintTime = event.block.timestamp;
  token.tokenURI = contract.tokenURI(event.params.tokenId);

  collection.numTokens = collection.numTokens.plus(BigInt.fromI32(1));

  owner.save();
  token.save();
  collection.save();

  return token;
}

/**
 * Make a unique token ID from contract address and id
 */
function tokenId(address: Address, id: BigInt): string {
  return address.toHexString() + "-" + id.toString();
}
