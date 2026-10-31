export type ContractCode = "malformed" | "unknown-field" | "invalid";

export class FilmContractError extends Error {
  readonly code: ContractCode;
  readonly fieldPath: string;

  constructor(code: ContractCode, fieldPath: string, message: string) {
    super(message);
    this.name = "FilmContractError";
    this.code = code;
    this.fieldPath = fieldPath;
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function objectAt(
  value: unknown,
  fieldPath: string,
  keys: readonly string[],
): Record<string, unknown> {
  if (!isRecord(value)) {
    throw new FilmContractError("malformed", fieldPath, `${fieldPath} must be an object`);
  }
  for (const key of Object.keys(value)) {
    if (!keys.includes(key)) {
      throw new FilmContractError("unknown-field", `${fieldPath}.${key}`, `Unknown field ${key}`);
    }
  }
  return value;
}

export function oneOf<T extends string>(
  value: unknown,
  fieldPath: string,
  allowed: readonly T[],
): T {
  if (typeof value === "string") {
    for (const item of allowed) {
      if (value === item) return item;
    }
  }
  throw new FilmContractError(
    "invalid",
    fieldPath,
    `${fieldPath} must be one of ${allowed.join(", ")}`,
  );
}

export function readString(
  record: Record<string, unknown>,
  fieldPath: string,
  key: string,
  options: { required: boolean; max?: number; allowEmpty?: boolean },
): string {
  const value = record[key];
  const path = `${fieldPath}.${key}`;
  if (value === undefined && !options.required) return "";
  if (typeof value !== "string") {
    throw new FilmContractError("invalid", path, `${path} must be a string`);
  }
  const max = options.max ?? 20_000;
  if (value.length > max) {
    throw new FilmContractError("invalid", path, `${path} is too long`);
  }
  if (!options.allowEmpty && value.length === 0) {
    throw new FilmContractError("invalid", path, `${path} is required`);
  }
  return value;
}

// Lexical validation only. Filesystem access must separately confine the opened
// descriptor to the project root; these checks cannot detect symlinks.
export function readProjectRelativePath(
  record: Record<string, unknown>,
  fieldPath: string,
  key: string,
): string {
  const value = readString(record, fieldPath, key, { required: true, max: 4096 });
  if (
    /[\\:]/.test(value) ||
    value.includes("\0") ||
    value.split("/").some((part) => !part || part === "." || part === "..")
  ) {
    throw new FilmContractError(
      "invalid",
      `${fieldPath}.${key}`,
      `${fieldPath}.${key} must be a project-relative path`,
    );
  }
  return value;
}

export function readInt(
  record: Record<string, unknown>,
  fieldPath: string,
  key: string,
  options: { min: number; max: number; required?: boolean },
): number {
  const value = record[key];
  const path = `${fieldPath}.${key}`;
  if (value === undefined && options.required === false) {
    throw new FilmContractError("invalid", path, `${path} is required`);
  }
  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value < options.min ||
    value > options.max
  ) {
    throw new FilmContractError("invalid", path, `${path} is out of range`);
  }
  return value;
}

export function readNullableInt(
  record: Record<string, unknown>,
  fieldPath: string,
  key: string,
  options: { min: number; max: number },
): number | null {
  const value = record[key];
  if (value === null || value === undefined) return null;
  const path = `${fieldPath}.${key}`;
  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value < options.min ||
    value > options.max
  ) {
    throw new FilmContractError("invalid", path, `${path} is out of range`);
  }
  return value;
}

export function readHash(record: Record<string, unknown>, fieldPath: string, key: string): string {
  const value = readString(record, fieldPath, key, { required: true, max: 64 });
  if (!/^[a-f0-9]{64}$/.test(value)) {
    throw new FilmContractError(
      "invalid",
      `${fieldPath}.${key}`,
      `${fieldPath}.${key} must be a sha256`,
    );
  }
  return value;
}

export function readOptionalHash(
  record: Record<string, unknown>,
  fieldPath: string,
  key: string,
): string | null {
  const value = record[key];
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string" || !/^[a-f0-9]{64}$/.test(value)) {
    throw new FilmContractError(
      "invalid",
      `${fieldPath}.${key}`,
      `${fieldPath}.${key} must be a sha256`,
    );
  }
  return value;
}

export function readProducerId(
  record: Record<string, unknown>,
  fieldPath: string,
  key: string,
): string {
  const value = readString(record, fieldPath, key, { required: true, max: 120 });
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]{0,119}$/.test(value)) {
    throw new FilmContractError(
      "invalid",
      `${fieldPath}.${key}`,
      `${fieldPath}.${key} must be a producer-safe id`,
    );
  }
  return value;
}

export function readShotKey(
  record: Record<string, unknown>,
  fieldPath: string,
  key: string,
): string {
  const value = readString(record, fieldPath, key, { required: true, max: 200 });
  if (!/^[A-Za-z0-9:_-]{1,200}$/.test(value)) {
    throw new FilmContractError(
      "invalid",
      `${fieldPath}.${key}`,
      `${fieldPath}.${key} is not a shot key`,
    );
  }
  return value;
}

export function readStringList(
  record: Record<string, unknown>,
  fieldPath: string,
  key: string,
): string[] {
  const value = record[key];
  const path = `${fieldPath}.${key}`;
  if (!Array.isArray(value)) {
    throw new FilmContractError("malformed", path, `${path} must be a list`);
  }
  return value.map((item, index) => {
    if (typeof item !== "string" || item.length === 0 || item.length > 2000) {
      throw new FilmContractError("invalid", `${path}.${index}`, `${path}.${index} must be text`);
    }
    return item;
  });
}

export function readBoolean(
  record: Record<string, unknown>,
  fieldPath: string,
  key: string,
): boolean {
  const value = record[key];
  if (typeof value !== "boolean") {
    throw new FilmContractError(
      "invalid",
      `${fieldPath}.${key}`,
      `${fieldPath}.${key} must be boolean`,
    );
  }
  return value;
}

export function mapObjects<T>(
  value: unknown,
  fieldPath: string,
  keys: readonly string[],
  map: (record: Record<string, unknown>, itemPath: string) => T,
): T[] {
  if (!Array.isArray(value)) {
    throw new FilmContractError("malformed", fieldPath, `${fieldPath} must be a list`);
  }
  return value.map((item, index) => {
    const itemPath = `${fieldPath}.${index}`;
    return map(objectAt(item, itemPath, keys), itemPath);
  });
}

export function mapNamedFields<T>(
  value: unknown,
  fieldPath: string,
  limit: number,
  label: string,
  map: (key: string, item: unknown) => T,
): Record<string, T> {
  if (!isRecord(value)) {
    throw new FilmContractError("malformed", fieldPath, `${fieldPath} must be an object`);
  }
  const entries = Object.entries(value);
  if (entries.length > limit) {
    throw new FilmContractError("invalid", fieldPath, `${fieldPath} has too many ${label}`);
  }
  return Object.fromEntries(entries.map(([key, item]) => [key, map(key, item)]));
}
