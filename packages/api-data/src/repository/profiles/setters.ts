import { IContext, IGunCallback, IGunInstance, TABLE_ENUMS, TABLES } from '../../types';
import { ApiError } from '../../utils/errors';
import * as profileHandles from './handles';

import uuidv4 from 'uuid/v4';

import { cleanGunMetaFromObject, getContextMeta } from '../../utils/helpers';
import {
	FRIEND_TYPES,
	FriendResponses,
	IAcceptFriendInput,
	IAddFriendInput,
	IClearFriendRequestInput,
	IClearFriendResponseInput,
	ICreateProfileInput,
	IReadFriendRequestInput,
	IRemoveFriendInput,
	IUpdateProfileInput,
} from './types';

const pollyLoadAccounts = (gun: IGunInstance, cb: any) => {
	gun.path(TABLES.PROFILES).docLoad(() => {
		cb();
	});
};

const preLoadFriendRequests = (gun: IGunInstance, cb: any) => {
	gun.path(`${TABLES.NOTIFICATIONS}.${TABLE_ENUMS.FRIEND_REQUESTS}`).once(() => {
		cb();
	});
};

// TODO: clean this up

export const createProfile = (
	context: IContext,
	createProfileInput: ICreateProfileInput,
	callback: IGunCallback<null>,
) => {
	const { gun } = context;
	const { username: alias, ...rest } = createProfileInput;
	/**
	 * add the profile data to the current user's private scope profile record
	 */
	const mainRunner = () => {
		profileHandles.currentUserProfileData(context).put(
			{
				...rest,
				alias,
			},
			(createProfileOnAccCallback) => {
				if (createProfileOnAccCallback.err) {
					return callback(
						new ApiError(
							`failed to create user profile on current account ${createProfileOnAccCallback.err}`,
							{
								initialRequestBody: createProfileInput,
							},
						),
					);
				}
				pollyLoadAccounts(gun, () =>
					createUserProfRaw(profileHandles.currentUserProfileData(context)),
				);
			},
		);
	};
	/**
	 * reference the private user's profile to the public profiles record
	 * @param ref IGunInstance reference to the private scope user profile
	 */
	const createUserProfRaw = (ref: IGunInstance) => {
		profileHandles.publicProfileByUsername(context, alias).put(ref, (profileCallback) => {
			if (profileCallback.err) {
				return callback(
					new ApiError(`failed to create user profile ${profileCallback.err}`, {
						initialRequestBody: createProfileInput,
					}),
				);
			}

			return callback(null);
		});
	};
	// run sequence
	mainRunner();
};

export const updateProfile = (
	context: IContext,
	updateProfileInput: IUpdateProfileInput,
	callback: IGunCallback<null>,
) => {
	/**
	 * update the current user's private scope profile, this will reflect changes on the public scope
	 * aswell because the public scope has a reference to the private scope record
	 */
	const mainRunner = () => {
		profileHandles.currentUserProfileData(context).put(updateProfileInput, (updateCallback) => {
			if (updateCallback.err) {
				return callback(
					new ApiError(`failed to update user profile ${updateCallback.err}`, {
						initialRequestBody: updateProfileInput,
					}),
				);
			}
			return callback(null);
		});
	};
	// run sequence
	mainRunner();
};

const flagFriendRequest = (context: IContext, username: string) =>
	new Promise((resolve) => {
		profileHandles
			.publicCurrentFriendRequestFromUsername(context, username)
			.put({ read: true }, () => {
				resolve();
			});
	});

const flagFriendResponse = (context: IContext, username: string) =>
	new Promise((resolve) => {
		profileHandles.publicCurrentFriendResponseFrom(context, username).put({ read: true }, () => {
			resolve();
		});
	});

/**
 * check if the current user is already friends with the targeted user
 */
const checkIfUserFriendExists = (context: IContext, username: string) => {
	return new Promise((res, rej) =>
		profileHandles.currentProfileFriendByUsername(context, username).once(
			(currentFriendCallback: any) => {
				if (currentFriendCallback) {
					res(true);
				}
				res(false);
			},
			{ wait: 1000 },
		),
	);
};

/**
 * check if the current user already send a friend request to the targeted user
 */
const checkIfFriendRequestExists = (context: IContext, to: string, from: string) => {
	return new Promise((res, rej) =>
		profileHandles.publicFriendRequestToFrom(context, to, from).once(
			(currentRequestCallback: any) => {
				if (currentRequestCallback) {
					res(true);
				}
				res(false);
			},
			{ wait: 1000 },
		),
	);
};

/**
 * check if the current user is already friends with the targeted user
 */
const checkIfAlreadyFriends = (context: IContext, username: string) => {
	return new Promise((res, rej) =>
		profileHandles.currentProfileFriendByUsername(context, username).once(
			(currentTargetedFriend: any) => {
				if (currentTargetedFriend) {
					const currentFriend = cleanGunMetaFromObject(currentTargetedFriend);
					if (Object.keys(currentFriend).length) {
						res(true);
					}
					res(false);
				}
				res(false);
			},
			{ wait: 1000 },
		),
	);
};

/**
 * check if the current user has this specific friend response
 */
const checkIfFriendResponseExists = (context: IContext, from: string) => {
	return new Promise((res, rej) =>
		profileHandles.publicCurrentFriendResponseFrom(context, from).once(
			(currentResponseCallback: any) => {
				if (currentResponseCallback) {
					res(true);
				}
				res(false);
			},
			{ wait: 1000 },
		),
	);
};

/**
 * check if a user has a friend response from the current user
 */
const checkIfUserFriendResponseExists = (context: IContext, to: string) => {
	const { owner } = getContextMeta(context);
	return new Promise((res, rej) =>
		profileHandles.publicFriendResponseToFrom(context, to, owner).once(
			(currentResponseCallback: any) => {
				if (currentResponseCallback) {
					res(true);
				}
				res(false);
			},
			{ wait: 500 },
		),
	);
};

/**
 * check if current user has friend requests from a user
 */
const checkIfUserHasRequest = (context: IContext, from: string) => {
	const { owner } = getContextMeta(context);
	return new Promise((res, rej) =>
		profileHandles.publicFriendRequestToFrom(context, owner, from).once(
			(friendRequestCallback: any) => {
				if (friendRequestCallback) {
					res(true);
				}
				res(false);
			},
			{ wait: 1000 },
		),
	);
};

/**
 * check if the targeted user exists and get his profile reference then pass it to create profile
 * @param username string containing the targeted user
 */
const getTargetedUserAndCreateRequest = (context: IContext, username: string) => {
	return new Promise((res, rej) =>
		profileHandles.publicProfileByUsername(context, username).once(
			(userProfileCallback: any) => {
				if (!userProfileCallback) {
					rej(new ApiError(`user does not exist!`));
				}
				res();
			},
			{ wait: 1000 },
		),
	);
};

/**
 * create a friend record on the current user's private scope and put the friend's entire profile reference
 * @param username string containing the targeted user
 */
const createFriendPrivateRecord = (context: IContext, username: string) => {
	return new Promise((res, rej) => {
		const { gun } = context;
		const ref = gun.get(TABLES.PROFILES).get(username);
		profileHandles.currentProfileFriendsRecord(context).erase(username, () => {
			profileHandles
				.currentProfileFriendByUsername(context, username)
				.put(ref, (friendCreationCallback) => {
					if (friendCreationCallback.err) {
						rej(new ApiError(`something went wrong on creating the friend!`));
					}
					res();
				});
		});
	});
};

/**
 * remove friend from the current user's private friends record
 */
const removeFriendFromPrivateRecord = (context: IContext, username: string) => {
	return new Promise((res, rej) =>
		profileHandles
			.currentProfileFriendsRecord(context)
			.put({ [username]: null }, (removeFriendCallback) => {
				if (removeFriendCallback.err) {
					rej(new ApiError(`something went wrong on deleting the friend`));
				}
				res();
			}),
	);
};

/**
 * remove the pending friend request from the public record of friend requests
 * @param
 */
const removePendingAndProceed = (context: IContext, username: string) => {
	return new Promise((res, rej) =>
		profileHandles
			.publicCurrentFriendRequests(context)
			.put({ [username]: null }, (removePendingCallback) => {
				if (removePendingCallback.err) {
					rej(new ApiError(`cannot remove pending friend request`));
				}
				res();
			}),
	);
};

/**
 * remove the friend response from the current users public record
 * @param
 */
const removeFriendResponse = (context: IContext, username: string) => {
	return new Promise((res, rej) =>
		profileHandles
			.publicCurrentFriendResponse(context)
			.put({ [username]: null }, (removeResponseCallback) => {
				if (removeResponseCallback.err) {
					rej(new ApiError(`cannot remove friend response`));
				}
				res();
			}),
	);
};

/**
 * remove a friend request from the targeted user from the current user
 */
const removeFriendRequest = (context: IContext, username: string) => {
	const { owner } = getContextMeta(context);
	return new Promise((res, rej) =>
		profileHandles
			.publicUserFriendRequests(context, username)
			.put({ [owner]: null }, (removeFriendRequestCallback) => {
				if (removeFriendRequestCallback.err) {
					rej(new ApiError('cannot remove friend request'));
				}
				res();
			}),
	);
};

/**
 * remove the friend response from the current users public record
 * @param
 */
const getCurrentUserProfile = (context: IContext) => {
	const { account } = context;
	return new Promise((res, rej) =>
		account.path(`profile.${account.is.alias}`).open(
			(profile) => {
				res(profile);
			},
			{ off: 1, wait: 400 },
		),
	);
};

/**
 * get the public record of friend requests to the user from the current user and put the friend request data
 */
const createFriendRequestNotification = (
	context: IContext,
	username: string,
	uuid: string,
	fullName: string,
	avatar: string,
) => {
	const { owner, ownerPub, timestamp } = getContextMeta(context);
	return new Promise((res, rej) =>
		profileHandles.publicCurrentFriendRequestToUsername(context, username).put(
			{
				id: uuid,
				fullName,
				avatar,
				owner: {
					alias: owner,
					pub: ownerPub,
				},
				timestamp,
				read: false,
			},
			(friendRequestCreationCallback) => {
				if (friendRequestCreationCallback.err) {
					rej(new ApiError(`something went wrong on creating the friend request to the user!`));
				}
				res();
			},
		),
	);
};

const createFriendRequestResponse = (
	context: IContext,
	to: string,
	response: FriendResponses,
	uuid: string,
	fullName: string,
	avatar: string,
) => {
	const { owner, ownerPub, timestamp } = getContextMeta(context);
	return new Promise((res, rej) =>
		profileHandles.publicFriendResponseToFrom(context, to, owner).put(
			{
				id: uuid,
				fullName,
				avatar,
				owner: {
					alias: owner,
					pub: ownerPub,
				},
				timestamp,
				type: response,
				read: false,
			},
			(friendResponseCallback) => {
				if (friendResponseCallback.err) {
					rej(
						new ApiError(
							`something went wrong while creating a response -> ${friendResponseCallback.err}`,
						),
					);
				}
				res();
			},
		),
	);
};

export const addFriend = async (
	context: IContext,
	{ username }: IAddFriendInput,
	callback: IGunCallback<null>,
) => {
	try {
		const { account } = context;
		if (!account.is) {
			return callback(
				new ApiError(`no user logged in`, {
					initialRequestBody: { username },
				}),
			);
		}
		const { owner } = getContextMeta(context);
		const errPrefix = 'failed to add friend';
		if (owner === username) {
			return callback(
				new ApiError(`${errPrefix}, can not add self`, {
					initialRequestBody: { username },
				}),
			);
		}

		const friendExists = await checkIfUserFriendExists(context, username);
		if (friendExists) {
			return callback(new ApiError('friend already exists on the user friends'));
		}

		const friendRequestExists = await checkIfFriendRequestExists(
			context,
			username,
			account.is.alias,
		);
		if (friendRequestExists) {
			await createFriendPrivateRecord(context, username);
			return callback(null);
			// return callback(new ApiError('friend request already exists'));
		}

		const userHasRequest = await checkIfUserHasRequest(context, username);
		if (userHasRequest) {
			await createFriendPrivateRecord(context, username);
			return callback(null);
			// return callback(new ApiError('user has already sent current user a friend request'));
		}

		const alreadyFriends = await checkIfAlreadyFriends(context, username);
		if (alreadyFriends) {
			return callback(new ApiError('friend already exists'));
		}

		await getTargetedUserAndCreateRequest(context, username);
		preLoadFriendRequests(context.gun, async () => {
			await createFriendPrivateRecord(context, username);
			const profile: any = await getCurrentUserProfile(context);
			await createFriendRequestNotification(
				context,
				username,
				uuidv4(),
				profile.fullName,
				profile.avatar,
			);
			callback(null);
		});
	} catch (e) {
		callback(e);
	}
};

export const removeFriend = async (
	context: IContext,
	{ username }: IRemoveFriendInput,
	callback: IGunCallback<null>,
) => {
	const { account } = context;
	if (!account.is) {
		return callback(
			new ApiError('no user logged in', {
				initialRequestBody: { username },
			}),
		);
	}
	try {
		if (account.is.alias === username) {
			return callback(new ApiError('wut?'));
		}
		const alreadyFriends = await checkIfAlreadyFriends(context, username);
		if (!alreadyFriends) {
			return callback(new ApiError('cannot remove a friend that doesnt exist on the record'));
		}
		await removeFriendFromPrivateRecord(context, username);
		callback(null);
	} catch (e) {
		callback(e);
	}
};

export const acceptFriend = async (
	context: IContext,
	{ username }: IAcceptFriendInput,
	callback: IGunCallback<null>,
) => {
	try {
		const { account } = context;
		if (!account.is) {
			return callback(
				new ApiError('no user logged in', {
					initialRequestBody: { username },
				}),
			);
		}
		const friendRequestExists = await checkIfFriendRequestExists(
			context,
			account.is.alias,
			username,
		);
		if (!friendRequestExists) {
			return callback(new ApiError('friend request does not exist'));
		}

		const profile: any = await getCurrentUserProfile(context);

		const alreadyFriends = await checkIfAlreadyFriends(context, username);
		if (alreadyFriends) {
			await createFriendRequestResponse(
				context,
				username,
				FriendResponses.Accepted,
				uuidv4(),
				profile.fullName,
				profile.avatar,
			);
			await removePendingAndProceed(context, username);
			return callback(null);
		}

		await createFriendRequestResponse(
			context,
			username,
			FriendResponses.Accepted,
			uuidv4(),
			profile.fullName,
			profile.avatar,
		);

		const friendExists = await checkIfUserFriendExists(context, username);
		if (friendExists) {
			return callback(null);
		}
		await createFriendPrivateRecord(context, username);
		await removePendingAndProceed(context, username);
		callback(null);
	} catch (e) {
		callback(e);
	}
};

export const rejectFriend = async (
	context: IContext,
	{ username }: IAcceptFriendInput,
	callback: IGunCallback<null>,
) => {
	try {
		const { account } = context;
		if (!account.is) {
			return callback(
				new ApiError('no user logged in', {
					initialRequestBody: { username },
				}),
			);
		}
		const friendRequestExists = await checkIfFriendRequestExists(
			context,
			account.is.alias,
			username,
		);
		if (!friendRequestExists) {
			return callback(new ApiError('friend request does not exist'));
		}

		const profile: any = await getCurrentUserProfile(context);
		await createFriendRequestResponse(
			context,
			username,
			FriendResponses.Rejected,
			uuidv4(),
			profile.fullName,
			profile.avatar,
		);
		await removePendingAndProceed(context, username);
		callback(null);
	} catch (e) {
		callback(e);
	}
};

export const clearFriendResponse = async (
	context: IContext,
	args: IClearFriendResponseInput,
	callback: IGunCallback<null>,
) => {
	try {
		const { account } = context;
		const { username } = args;
		if (!account.is) {
			return callback(
				new ApiError('no user logged in', {
					initialRequestBody: { username },
				}),
			);
		}
		const friendResponseExists = await checkIfFriendResponseExists(context, username);
		if (!friendResponseExists) {
			return callback(new ApiError('friend response does not exist'));
		}

		await removeFriendResponse(context, username);
		callback(null);
	} catch (e) {
		callback(e);
	}
};

export const clearFriendRequest = async (
	context: IContext,
	args: IClearFriendRequestInput,
	callback: IGunCallback<null>,
) => {
	try {
		const { owner } = getContextMeta(context);
		const { account } = context;
		const { username } = args;

		if (!account.is) {
			return callback(
				new ApiError('no user logged in', {
					initialRequestBody: { username },
				}),
			);
		}
		const friendRequestExists = await checkIfFriendRequestExists(context, username, owner);
		if (!friendRequestExists) {
			return callback(new ApiError('friend request does not exist to remove'));
		}

		await removeFriendRequest(context, username);
		await removeFriendFromPrivateRecord(context, username);
		callback(null);
	} catch (e) {
		callback(e);
	}
};

export const readFriendRequests = async (
	context: IContext,
	args: IReadFriendRequestInput,
	callback: IGunCallback<null>,
) => {
	const { owner } = getContextMeta(context);
	const { account } = context;

	if (!account.is) {
		return callback(
			new ApiError('no user logged in', {
				initialRequestBody: { args },
			}),
		);
	}

	const errs: ApiError[] = [];
	const { usernames } = args;

	// tslint:disable-next-line
	for (let i = 0; i < usernames.length; i++) {
		const username = usernames[i];
		const friendRequestExists = await checkIfFriendRequestExists(context, owner, username);
		if (!friendRequestExists) {
			errs.push(new ApiError(`friend request does not exist to remove on ${username}`));
		} else {
			await flagFriendRequest(context, username);
		}
	}

	if (errs.length > 0) {
		callback(
			new ApiError('failed to read some notifications', {
				initialRequestBody: errs,
			}),
		);
	} else {
		callback(null);
	}
};

export const readFriendResponses = async (
	context: IContext,
	args: IReadFriendRequestInput,
	callback: IGunCallback<null>,
) => {
	const { account } = context;

	if (!account.is) {
		return callback(
			new ApiError('no user logged in', {
				initialRequestBody: { args },
			}),
		);
	}

	const errs: ApiError[] = [];
	const { usernames } = args;

	// tslint:disable-next-line
	for (let i = 0; i < usernames.length; i++) {
		const username = usernames[i];
		const friendResponseExists = await checkIfFriendResponseExists(context, username);
		if (!friendResponseExists) {
			errs.push(new ApiError(`friend response does not exist to remove on ${username}`));
		} else {
			await flagFriendResponse(context, username);
		}
	}

	if (errs.length > 0) {
		callback(
			new ApiError('failed to read some notifications', {
				initialRequestBody: errs,
			}),
		);
	} else {
		callback(null);
	}
};

export default {
	createProfile,
	updateProfile,
	addFriend,
	removeFriend,
	acceptFriend,
	rejectFriend,
	clearFriendResponse,
	clearFriendRequest,
	readFriendRequests,
	readFriendResponses,
};
