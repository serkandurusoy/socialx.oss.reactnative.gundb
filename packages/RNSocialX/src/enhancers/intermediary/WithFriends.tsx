import * as React from 'react';

import { ActionTypes, IAliasInput } from '../../store/data/profiles/Types';
import { FRIEND_TYPES, ILocaleDictionary, IOptionsMenuItem } from '../../types';

import { IActivity } from '../../store/ui/activities';
import { WithI18n } from '../connectors/app/WithI18n';
import { WithProfiles } from '../connectors/data/WithProfiles';
import { WithActivities } from '../connectors/ui/WithActivities';
import { WithOverlays } from '../connectors/ui/WithOverlays';
import { getActivityForFriends } from '../helpers';

export interface IWithFriendsEnhancedData {
	relationship: {
		action: string;
		activity: IActivity | null;
		onStatusAction: (alias: string) => void;
	};
	request: {
		accepting: boolean;
		rejecting: boolean;
	};
}

export interface IWithFriendsEnhancedActions {
	onAcceptFriendRequest: (alias: string, id: string) => void;
	onDeclineFriendRequest: (alias: string, id: string) => void;
}

interface IWithFriendstEnhancedProps {
	data: IWithFriendsEnhancedData;
	actions: IWithFriendsEnhancedActions;
}

interface IWithFriendsProps {
	status?: FRIEND_TYPES;
	children(props: IWithFriendstEnhancedProps): JSX.Element;
}

interface IWithFriendsState {
	request: {
		accepting: boolean;
		rejecting: boolean;
	};
}

export class WithFriends extends React.Component<IWithFriendsProps, IWithFriendsState> {
	public state = {
		request: {
			accepting: false,
			rejecting: false,
		},
	};

	private dictionary!: ILocaleDictionary;
	private actions: {
		addFriend: (input: IAliasInput) => void;
		removeFriend: (input: IAliasInput) => void;
		acceptFriend: (input: IAliasInput) => void;
		rejectFriend: (input: IAliasInput) => void;
		undoRequest: (input: IAliasInput) => void;
		showOptionsMenu: (items: IOptionsMenuItem[]) => void;
	} = {
		addFriend: () => undefined,
		removeFriend: () => undefined,
		acceptFriend: () => undefined,
		rejectFriend: () => undefined,
		undoRequest: () => undefined,
		showOptionsMenu: () => undefined,
	};

	public render() {
		return (
			<WithI18n>
				{({ dictionary }) => (
					<WithOverlays>
						{({ showOptionsMenu }) => (
							<WithActivities>
								{({ activities }) => (
									<WithProfiles>
										{({ addFriend, removeFriend, acceptFriend, rejectFriend, undoRequest }) => {
											this.dictionary = dictionary;
											this.actions = {
												addFriend,
												removeFriend,
												acceptFriend,
												rejectFriend,
												undoRequest,
												showOptionsMenu,
											};

											return this.props.children({
												data: {
													relationship: {
														action: this.getAction(),
														activity: this.getActivity(activities),
														onStatusAction: (alias) => this.getHandler(alias)(),
													},
													request: this.state.request,
												},
												actions: {
													onAcceptFriendRequest: this.onAcceptFriendRequestHandler,
													onDeclineFriendRequest: this.onDeclineFriendRequestHandler,
												},
											});
										}}
									</WithProfiles>
								)}
							</WithActivities>
						)}
					</WithOverlays>
				)}
			</WithI18n>
		);
	}

	private getAction = () => {
		let action = this.dictionary.components.buttons.addFriend;

		if (this.props.status) {
			switch (this.props.status) {
				case FRIEND_TYPES.MUTUAL:
					action = this.dictionary.components.buttons.friends;
					break;
				case FRIEND_TYPES.PENDING:
					action = this.dictionary.components.buttons.undo;
					break;
				case FRIEND_TYPES.NOT_FRIEND:
					action = this.dictionary.components.buttons.addFriend;
					break;
				default:
					action = this.dictionary.components.buttons.addFriend;
					break;
			}
		}

		return action;
	};

	private getActivity = (activities: IActivity[]) => {
		let activity: IActivity | null = null;

		if (this.props.status) {
			switch (this.props.status) {
				case FRIEND_TYPES.MUTUAL:
					activity = getActivityForFriends(activities, ActionTypes.REMOVE_FRIEND);
					break;
				case FRIEND_TYPES.PENDING:
					activity = getActivityForFriends(activities, ActionTypes.UNDO_REQUEST);
					break;
				case FRIEND_TYPES.NOT_FRIEND:
					activity = getActivityForFriends(activities, ActionTypes.ADD_FRIEND);
					break;
				default:
					activity = null;
					break;
			}
		}

		return activity;
	};

	private getHandler = (alias: string) => {
		let handler: () => void = () => this.onAddFriendHandler(alias);

		if (this.props.status) {
			switch (this.props.status) {
				case FRIEND_TYPES.MUTUAL:
					handler = () => this.onShowOptionsHandler(alias);
					break;
				case FRIEND_TYPES.PENDING:
					handler = () => this.onUndoRequestHandler(alias);
					break;
				case FRIEND_TYPES.NOT_FRIEND:
					handler = () => this.onAddFriendHandler(alias);
					break;
				default:
					handler = () => this.onAddFriendHandler(alias);
					break;
			}
		}

		return handler;
	};

	private onShowOptionsHandler = (alias: string) => {
		const { showOptionsMenu } = this.actions;

		const items = [
			{
				label: this.dictionary.components.modals.options.unfriend,
				icon: 'md-remove-circle',
				actionHandler: () => this.onRemoveFriendHandler(alias),
			},
		];

		showOptionsMenu(items);
	};

	private onAddFriendHandler = async (username: string) => {
		await this.actions.addFriend({ username });
	};

	private onRemoveFriendHandler = async (username: string) => {
		await this.actions.removeFriend({ username });
	};

	private onUndoRequestHandler = async (username: string) => {
		await this.actions.undoRequest({ username });
	};

	private onAcceptFriendRequestHandler = async (username: string, id: string) => {
		this.setState((currentState) => ({
			request: {
				...currentState.request,
				accepting: true,
			},
		}));
		await this.actions.acceptFriend({ username, id });
		this.setState((currentState) => ({
			request: {
				...currentState.request,
				accepting: false,
			},
		}));
	};

	private onDeclineFriendRequestHandler = async (username: string, id: string) => {
		this.setState((currentState) => ({
			request: {
				...currentState.request,
				rejecting: true,
			},
		}));
		await this.actions.rejectFriend({ username, id });
		this.setState((currentState) => ({
			request: {
				...currentState.request,
				rejecting: false,
			},
		}));
	};
}
