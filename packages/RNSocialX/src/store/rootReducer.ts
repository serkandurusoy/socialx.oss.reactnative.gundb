import { combineReducers } from 'redux';

import { IState as IConfig, reducer as config } from './app/config';
import { IState as II18n, reducer as i18n } from './app/i18n';
import { IState as INavigationParams, reducer as navigationParams } from './app/navigationParams';
import { IState as IAuth, reducer as database } from './auth/gun';

import { IState as IAccounts, reducer as accounts } from './data/accounts';
import { IState as IComments, reducer as comments } from './data/comments';
import { IState as IMessages, reducer as messages } from './data/messages';
import { IState as INotifications, reducer as notifications } from './data/notifications';
import { IState as IPosts, reducer as posts } from './data/posts';
import { IState as IProfiles, reducer as profiles } from './data/profiles';

import { IState as IFiles, reducer as files } from './storage/files';

import { IState as IActivities, reducer as activities } from './ui/activities';
import { IState as IGlobals, reducer as globals } from './ui/globals';
import { IState as IOverlays, reducer as overlays } from './ui/overlays';

export interface IApplicationState {
	auth: {
		database: IAuth;
	};
	data: {
		accounts: IAccounts;
		comments: IComments;
		messages: IMessages;
		notifications: INotifications;
		posts: IPosts;
		profiles: IProfiles;
	};
	app: {
		config: IConfig;
		i18n: II18n;
		navigationParams: INavigationParams;
	};
	ui: {
		activities: IActivities;
		globals: IGlobals;
		overlays: IOverlays;
	};
	storage: {
		files: IFiles;
	};
}

export default combineReducers<IApplicationState>({
	data: combineReducers({
		accounts,
		comments,
		messages,
		notifications,
		posts,
		profiles,
	}),
	auth: combineReducers({
		database,
	}),
	app: combineReducers({
		config,
		i18n,
		navigationParams,
	}),
	ui: combineReducers({
		activities,
		globals,
		overlays,
	}),
	storage: combineReducers({
		files,
	}),
});
