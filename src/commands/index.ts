import buildAppCommand from './build/app';
import buildComponentsCommand from './build/components';
import devCommand from './dev';
import ejectConfigCommand from './eject/config';
import ejectPagesCommand from './eject/pages';
import ejectThemeCommand from './eject/theme';
import fetchCommand from './fetch';
import makeComponentCommand from './make/component';
import makePageCommand from './make/page';
import makeTemplateCommand from './make/template';
import scaffoldCommand from './scaffold';
import startCommand from './start';
import validateComponentsCommand from './validate/components';

export const commands = [
  buildAppCommand,
  buildComponentsCommand,
  devCommand,
  ejectConfigCommand,
  ejectPagesCommand,
  ejectThemeCommand,
  fetchCommand,
  makePageCommand,
  makeComponentCommand,
  makeTemplateCommand,
  scaffoldCommand,
  startCommand,
  validateComponentsCommand,
];
