import type { TypeNode } from 'handoff-docgen';
import type * as TS from 'typescript';

/** Stops the type walk on deeply nested or recursive types. */
const MAX_TYPE_DEPTH = 4;

/** Maps a TypeScript type to the docgen type tree that the properties table and the preview editor read. */
export const toTypeNode = (ts: typeof TS, checker: TS.TypeChecker, type: TS.Type, depth = 0): TypeNode => {
  const display = checker.typeToString(type);
  if (depth > MAX_TYPE_DEPTH) return { kind: 'unknown', display, truncated: true };
  if (type.flags & (ts.TypeFlags.StringLike | ts.TypeFlags.NumberLike | ts.TypeFlags.BooleanLike) && !type.isUnion()) {
    return { kind: 'primitive', display };
  }
  if (type.flags & ts.TypeFlags.Boolean) return { kind: 'primitive', display: 'boolean' };
  if (type.flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown)) return { kind: 'unknown', display };

  if (type.isUnion()) {
    const members = type.types.filter((member) => !(member.flags & (ts.TypeFlags.Undefined | ts.TypeFlags.Null | ts.TypeFlags.Void)));
    if (members.length && members.every((member) => member.flags & ts.TypeFlags.BooleanLiteral)) {
      return { kind: 'primitive', display: 'boolean' };
    }
    // A string or numeric enum is a union of its member literals, so it lists the values, not the member names.
    if (members.length > 1 && members.every((member) => member.isStringLiteral() || member.isNumberLiteral())) {
      return { kind: 'enum', display, members: members.map((member) => JSON.stringify((member as TS.LiteralType).value)) };
    }
    if (members.length === 1) return toTypeNode(ts, checker, members[0], depth);
    return { kind: 'union', display, children: members.map((member) => toTypeNode(ts, checker, member, depth + 1)) };
  }

  if (checker.isArrayType(type)) {
    const [elementType] = checker.getTypeArguments(type as TS.TypeReference);
    return { kind: 'array', display, elementType: elementType ? toTypeNode(ts, checker, elementType, depth + 1) : undefined };
  }
  if (type.getCallSignatures().length) return { kind: 'function', display };
  if (type.flags & ts.TypeFlags.Object) {
    return {
      kind: 'object',
      display,
      properties: checker.getPropertiesOfType(type).map((property) => {
        const declaration = property.valueDeclaration ?? property.declarations?.[0];
        const propertyType = declaration ? checker.getTypeOfSymbolAtLocation(property, declaration) : checker.getAnyType();
        return {
          name: property.getName(),
          optional: !!(property.flags & ts.SymbolFlags.Optional),
          type: toTypeNode(ts, checker, propertyType, depth + 1),
          description: ts.displayPartsToString(property.getDocumentationComment(checker)) || undefined,
        };
      }),
    };
  }
  return { kind: 'unknown', display };
};

/** The `docgenType` that `toSlotMetadata` reads for a type tree of each kind; other kinds use their display text. */
export const DOCGEN_TYPE_BY_KIND: Partial<Record<TypeNode['kind'], string>> = {
  enum: 'enum',
  array: 'array',
  object: 'object',
  function: 'function',
  unknown: 'unknown',
};
