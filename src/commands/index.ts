import buildAppCommand from './build/app';
import buildComponentsCommand from './build/components';
import buildIntegrationCommand from './build/integration';
import buildRecipeCommand from './build/recipe';
import devCommand from './dev';
import ejectConfigCommand from './eject/config';
import ejectExportablesCommand from './eject/exportables';
import ejectIntegrationCommand from './eject/integration';
import ejectPagesCommand from './eject/pages';
import ejectSchemasCommand from './eject/schemas';
import ejectThemeCommand from './eject/theme';
import fetchCommand from './fetch';
import makeComponentCommand from './make/component';
import makeExportableCommand from './make/exportable';
import makeIntegrationCommand from './make/integration';
import makeIntegrationStylesCommand from './make/integrationStyles';
import makePageCommand from './make/page';
import makeSchemaCommand from './make/schema';
import makeTemplateCommand from './make/template';
import renameComponentCommand from './rename/component';
import startCommand from './start';

export const commands = [
  buildAppCommand,
  buildIntegrationCommand,
  buildRecipeCommand,
  buildComponentsCommand,
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
  makeComponentCommand,
  makeTemplateCommand,
  renameComponentCommand,
  makeIntegrationStylesCommand,
  startCommand,
];
