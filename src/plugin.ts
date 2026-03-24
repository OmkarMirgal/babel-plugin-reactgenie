import { NodePath } from '@babel/traverse';
import { PluginObj } from '@babel/core';
import * as t from '@babel/types';
import { declare } from '@babel/helper-plugin-utils';
import { parameterVisitor } from './parameter/parameterVisitor';
import { metadataVisitor } from './metadata/metadataVisitor';

function isGenieClassDecorator(
  decorator: t.Decorator | null | undefined
): boolean {
  if (!decorator) return false;

  const expression = decorator.expression;
  if (t.isIdentifier(expression)) {
    return expression.name === 'GenieClass';
  }

  if (t.isCallExpression(expression) && t.isIdentifier(expression.callee)) {
    return expression.callee.name === 'GenieClass';
  }

  return false;
}

function hasStableClassNameProperty(path: NodePath<t.ClassDeclaration>): boolean {
  return path
    .get('body')
    .get('body')
    .some((field: any) => {
      if (!field.isClassProperty()) return false;
      const key = field.node.key;
      return t.isIdentifier(key) && key.name === '__genieClassName';
    });
}

export default declare(
  (api: any): PluginObj => {
    api.assertVersion(7);

    return {
      visitor: {
        Program(programPath: NodePath<t.Program>) {
          /**
           * We need to traverse the program right here since
           * `@babel/preset-typescript` removes imports at this level.
           *
           * Since we need to convert some typings into **bindings**, used in
           * `Reflect.metadata` calls, we need to process them **before**
           * the typescript preset.
           */
          programPath.traverse({
            ClassDeclaration(path: NodePath<t.ClassDeclaration>) {
              if (
                path.node.id &&
                path.node.decorators?.some(isGenieClassDecorator) &&
                !hasStableClassNameProperty(path)
              ) {
                const stableNameProperty = t.classProperty(
                  t.identifier('__genieClassName'),
                  t.stringLiteral(path.node.id.name)
                );
                stableNameProperty.static = true;
                path.get('body').unshiftContainer('body', stableNameProperty);
              }

              for (const field of path.get('body').get('body')) {
                if (
                  field.type !== 'ClassMethod' &&
                  field.type !== 'ClassProperty'
                )
                  continue;

                parameterVisitor(path, field as any);
                metadataVisitor(path, field as any);
              }

              /**
               * We need to keep binding in order to let babel know where imports
               * are used as a Value (and not just as a type), so that
               * `babel-transform-typescript` do not strip the import.
               */
              (path.parentPath.scope as any).crawl();
            }
          });
        }
      }
    };
  }
);
