import sha1 from "js-sha1";

export default function hashObject(obj: any) {
  return sha1(JSON.stringify(obj));
}
