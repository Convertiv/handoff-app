import buildAppCommand from './build/app';
import buildIntegrationCommand from './build/integration';
import buildRecipeCommand from './build/recipe';
import buildSnippetsCommand from './build/snippets';
import devCommand from './dev';
import ejectConfigCommand from './eject/config';
import ejectExportablesCommand from './eject/exportables';
import ejectIntegrationCommand from './eject/integration';
import ejectPagesCommand from './eject/pages';
import ejectSchemasCommand from './eject/schemas';
import ejectThemeCommand from './eject/theme';
import fetchCommand from './fetch';
import makeExportableCommand from './make/exportable';
import makeIntegrationCommand from './make/integration';
import makePageCommand from './make/page';
import makeSchemaCommand from './make/schema';
import makeSnippetCommand from './make/snippet';
import makeTemplateCommand from './make/template';
import renameSnippetCommand from './rename/snippet';
import startCommand from './start';

export const commands = [
  buildAppCommand,
  buildIntegrationCommand,
  buildRecipeCommand,
  buildSnippetsCommand,
  devCommand,
  ejectConfigCommand,
  ejectExportablesCommand,
  ejectIntegrationCommand,
  ejectPagesCommand,
  ejectSchemasCommand,
  ejectThemeCommand,
  fetchCommand,
  makeExportableCommand,
  makeIntegrationCommand,
  makePageCommand,
  makeSchemaCommand,
  makeSnippetCommand,
  makeTemplateCommand,
  renameSnippetCommand,
  startCommand,
];
