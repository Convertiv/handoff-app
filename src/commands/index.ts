import buildCommand from './build';
import buildAppCommand from './build/app';
import buildComponentsCommand from './build/components';
import checkoutCommand from './checkout';
import dbMigrateCommand from './db/migrate';
import devCommand from './dev';
import ejectConfigCommand from './eject/config';
import ejectPagesCommand from './eject/pages';
import ejectThemeCommand from './eject/theme';
import fetchCommand from './fetch';
import initCommand from './init';
import loginCommand from './login';
import logoutCommand from './logout';
import makeComponentCommand from './make/component';
import makePageCommand from './make/page';
import makeTemplateCommand from './make/template';
import publishCommand from './publish';
import scaffoldCommand from './scaffold';
import startCommand from './start';
import validateComponentsCommand from './validate/components';

export const commands = [
  buildCommand,
  buildAppCommand,
  buildComponentsCommand,
  checkoutCommand,
  dbMigrateCommand,
  devCommand,
  ejectConfigCommand,
  ejectPagesCommand,
  ejectThemeCommand,
  fetchCommand,
  initCommand,
  loginCommand,
  logoutCommand,
  makePageCommand,
  makeComponentCommand,
  makeTemplateCommand,
  publishCommand,
  scaffoldCommand,
  startCommand,
  validateComponentsCommand,
];
