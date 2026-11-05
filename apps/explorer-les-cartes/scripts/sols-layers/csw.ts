import { DOMParser } from '@xmldom/xmldom';

/** Online resource of a CSW record (ISO 19115-3 `mrd:onLine/cit:CI_OnlineResource`). */
export interface CswLink {
  protocol: string;
  linkage: string;
  name: string;
  description: string;
}

export interface CswRecord {
  id: string;
  title: string;
  abstract: string;
  organisation: string;
  links: CswLink[];
}

const NS = {
  mdb: 'http://standards.iso.org/iso/19115/-3/mdb/2.0',
  mri: 'http://standards.iso.org/iso/19115/-3/mri/1.0',
  cit: 'http://standards.iso.org/iso/19115/-3/cit/2.0',
  mcc: 'http://standards.iso.org/iso/19115/-3/mcc/1.0',
  mrd: 'http://standards.iso.org/iso/19115/-3/mrd/1.0',
  gco: 'http://standards.iso.org/iso/19115/-3/gco/1.0',
} as const;

type Node = {
  nodeType: number;
  namespaceURI: string | null;
  localName: string | null;
  textContent: string | null;
  childNodes: ArrayLike<Node>;
};

function child(node: Node | undefined, ns: string, localName: string): Node | undefined {
  if (!node) return undefined;
  return Array.from(node.childNodes).find(
    (c) => c.nodeType === 1 && c.namespaceURI === ns && c.localName === localName,
  );
}

/** Follows a path of [namespace, localName] children and returns the gco:CharacterString text. */
function text(node: Node | undefined, path: Array<[string, string]>): string {
  let current = node;
  for (const [ns, name] of path) current = child(current, ns, name);
  const value = child(current, NS.gco, 'CharacterString') ?? current;
  return value?.textContent?.trim() ?? '';
}

function descendants(node: Node, ns: string, localName: string): Node[] {
  const out: Node[] = [];
  const walk = (n: Node) => {
    for (const c of Array.from(n.childNodes)) {
      if (c.nodeType !== 1) continue;
      if (c.namespaceURI === ns && c.localName === localName) out.push(c);
      walk(c);
    }
  };
  walk(node);
  return out;
}

/**
 * Parses a CSW GetRecords response in ISO 19115-3 (outputSchema mdb/2.0).
 * Throws when the response is an OGC exception document (sent by the GPF with HTTP 200).
 */
export function parseCswRecords(xml: string): CswRecord[] {
  const doc = new DOMParser().parseFromString(xml, 'text/xml') as unknown as {
    getElementsByTagNameNS(ns: string, name: string): ArrayLike<Node>;
    documentElement: Node | null;
  };
  const root = doc.documentElement;
  if (root && ['ExceptionReport', 'ServiceExceptionReport'].includes(root.localName ?? '')) {
    const text = (root.textContent ?? '').replace(/\s+/g, ' ').trim();
    throw new Error(`Le CSW a répondu par une exception OGC : ${text || root.localName}`);
  }
  return Array.from(doc.getElementsByTagNameNS(NS.mdb, 'MD_Metadata')).map((record) => {
    const identification = child(
      child(record, NS.mdb, 'identificationInfo'),
      NS.mri,
      'MD_DataIdentification',
    );
    const organisation = descendants(identification ?? record, NS.cit, 'CI_Organisation')[0];
    const links = descendants(
      child(record, NS.mdb, 'distributionInfo') ?? record,
      NS.cit,
      'CI_OnlineResource',
    ).map((resource) => ({
      protocol: text(resource, [[NS.cit, 'protocol']]),
      linkage: text(resource, [[NS.cit, 'linkage']]),
      name: text(resource, [[NS.cit, 'name']]),
      description: text(resource, [[NS.cit, 'description']]),
    }));
    return {
      id: text(record, [
        [NS.mdb, 'metadataIdentifier'],
        [NS.mcc, 'MD_Identifier'],
        [NS.mcc, 'code'],
      ]),
      title: text(identification, [
        [NS.mri, 'citation'],
        [NS.cit, 'CI_Citation'],
        [NS.cit, 'title'],
      ]),
      abstract: text(identification, [[NS.mri, 'abstract']]),
      organisation: text(organisation, [[NS.cit, 'name']]),
      links,
    };
  });
}
