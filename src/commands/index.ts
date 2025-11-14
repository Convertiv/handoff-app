import buildAppCommand from './build/app';
import buildComponentsCommand from './build/components';
import devCommand from './dev';
import ejectConfigCommand from './eject/config';
import ejectExportablesCommand from './eject/exportables';
import ejectPagesCommand from './eject/pages';
import ejectSchemasCommand from './eject/schemas';
import ejectThemeCommand from './eject/theme';
import fetchCommand from './fetch';
import makeComponentCommand from './make/component';
import makeExportableCommand from './make/exportable';
import makePageCommand from './make/page';
import makeSchemaCommand from './make/schema';
import makeTemplateCommand from './make/template';
import startCommand from './start';
import validateComponentsCommand from './validate/components';

export const commands = [
  buildAppCommand,
  buildComponentsCommand,
  devCommand,
  ejectConfigCommand,
  ejectExportablesCommand,
  ejectPagesCommand,
  ejectSchemasCommand,
  ejectThemeCommand,
  fetchCommand,
  makeExportableCommand,
  makePageCommand,
  makeSchemaCommand,
  makeComponentCommand,
  makeTemplateCommand,
  startCommand,
  validateComponentsCommand,
];
