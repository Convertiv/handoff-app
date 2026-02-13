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
import platformInitCommand from './platform/init';
import platformLoginCommand from './platform/login';
import platformLogoutCommand from './platform/logout';
import platformPullCommand from './platform/pull';
import platformPushCommand from './platform/push';
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
  platformLoginCommand,
  platformInitCommand,
  platformPullCommand,
  platformPushCommand,
  platformLogoutCommand,
  scaffoldCommand,
  startCommand,
  validateComponentsCommand,
];
