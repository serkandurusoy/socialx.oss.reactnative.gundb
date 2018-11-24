import * as profileHandles from '../profiles/handles';
import * as postHandles from './handles';

import { Base64 } from 'js-base64';

import {
	IContext,
	IGunCallback,
	ILikesArray,
	ILikesMetasCallback,
	IMetasCallback,
} from '../../types';
import { ApiError } from '../../utils/errors';
import {
	cleanGunMetaFromObject,
	convertGunSetToArray,
	convertGunSetToArrayWithKey,
	datePathFromDate,
} from '../../utils/helpers';

import moment from 'moment';
import { ICommentData } from '../comments';
import {
	IMedia,
	IPostArrayData,
	IPostCallbackData,
	IPostMetasCallback,
	IPostReturnData,
	IPostsDataCallback,
	IPostUserMetasCallback,
} from './types';

const noop = () => {
	///
};

export const getPostPathsByUser = (
	context: IContext,
	{ username }: { username: string },
	callback: IGunCallback<string[]>,
) => {
	postHandles.postMetasByUsername(context, username).docLoad((metasCallback: any) => {
		if (!metasCallback || !Object.keys(metasCallback).length) {
			return callback(null, []);
		}
		postHandles
			.postMetasByUsername(context, username)
			.docLoad((postsMeta: IPostUserMetasCallback) => {
				if (!postsMeta || !Object.keys(postsMeta).length) {
					return callback([]);
				}
				const paths = convertGunSetToArray(postsMeta)
					.map((postMeta: any = {}) => (postMeta ? postMeta.postPath : undefined))
					.filter((path) => !!path);
				return callback(null, paths);
			});
	});
};

const convertLikesToArray = (likes: ILikesMetasCallback): ILikesArray =>
	convertGunSetToArrayWithKey(likes).reduce((likesAgg: any[], like: any) => {
		const { k, ...rest } = like;
		if (!like['#'] && rest.owner) {
			likesAgg = [...likesAgg, rest];
		}
		return likesAgg;
	}, []);

const convertMediaToArray = (media: any): IMedia[] =>
	convertGunSetToArray(media).reduce((mediaAgg: any[], m: any) => {
		const { ...rest } = m;
		if (!m['#'] && Object.keys(rest).length > 0) {
			mediaAgg = [...mediaAgg, m];
		}
		return mediaAgg;
	}, []);

const convertCommentsToArray = (comments: any): ICommentData[] =>
	convertGunSetToArrayWithKey(comments).reduce(
		(commentsAgg: any[], { k, ...postComment }: any & { k: string }) => {
			// convert comment likes into an array with key
			const commentLikes = convertLikesToArray(postComment.likes);
			const { likes, ...postRest } = postComment;
			if (!postComment['#'] && postComment.owner) {
				commentsAgg = [
					...commentsAgg,
					{
						commentId: k,
						likes: commentLikes,
						...postRest,
					},
				];
			}
			return commentsAgg;
		},
		[],
	);

export const fastGetPostByPath = (
	context: IContext,
	{ postPath, wait }: { postPath: string; wait?: number },
	callback: IGunCallback<IPostReturnData>,
) => {
	postHandles.postByPath(context, postPath).open(
		(postData: IPostCallbackData) => {
			if (!postData || !Object.keys(postData).length) {
				return callback(
					new ApiError('failed, no post found', {
						initialRequestBody: { postPath },
					}),
				);
			}

			let shouldWaitAndTryAgain = false;

			// const keys = Object.keys()
			const { likes, comments, media, ...restPost } = postData;
			// convert likes into an array with keys
			const postLikes = convertLikesToArray(likes);
			// convert comments and their likes into an array with keys
			const postComments: any = convertCommentsToArray(comments);
			// convert media to an array
			const mediaReturn = convertMediaToArray(media) || [];

			[postLikes, postComments, mediaReturn].forEach((propArray: any = []) => {
				if (propArray && propArray.length) {
					propArray.forEach((obj: any) => {
						if (obj && typeof obj === 'object' && Object.keys(obj).includes('#')) {
							shouldWaitAndTryAgain = true;
						}
					});
				}
			});
			// related to the retry checks
			if (
				postData.owner &&
				typeof postData.owner === 'object' &&
				Object.keys(postData.owner).length === 0
			) {
				shouldWaitAndTryAgain = true;
			}

			if (!shouldWaitAndTryAgain) {
				const post: IPostReturnData = {
					postId: postPath.split('.').reverse()[0],
					likes: postLikes,
					comments: postComments,
					media: mediaReturn,
					...restPost,
				};
				return callback(null, post);
			}
			getPostByPath(
				context,
				{
					wait: wait ? wait + 100 : 400,
					postPath,
				},
				callback,
			);
		},
		{ off: 1, wait: wait || 400 },
	);
};

export const getPostByPath = (
	context: IContext,
	{ postPath, wait, timeout }: { postPath: string; wait?: number; timeout?: number },
	callback: IGunCallback<IPostReturnData>,
) => {
	const docOpts = {
		wait: wait || 300,
		timeout: timeout || 600,
	};

	const mainGetter = () => {
		postHandles.postByPath(context, postPath).open(
			(postData: IPostCallbackData) => {
				if (!postData || !Object.keys(postData).length) {
					return callback(null, undefined);
				}

				// const keys = Object.keys()
				const { likes, comments, media, ...restPost } = postData;
				// convert likes into an array with keys
				const postLikes = convertLikesToArray(likes);
				// convert comments and their likes into an array with keys
				const postComments: any = convertCommentsToArray(comments);
				// convert media to an array
				const mediaReturn = convertMediaToArray(media) || [];

				const post: IPostReturnData = {
					postId: postPath.split('.').reverse()[0],
					likes: postLikes,
					comments: postComments,
					media: mediaReturn,
					...restPost,
				};
				return callback(null, post);
			},
			{ off: 1, wait: 500 },
		);
	};
	postHandles.postByPath(context, postPath).once(
		(data: any) => {
			if (!data) {
				return callback(null, undefined);
			}
			mainGetter();
		},
		{ wait: 500 },
	);
};

export const getPostById = (
	context: IContext,
	{ postId }: { postId: string },
	callback: IGunCallback<IPostReturnData>,
) => {
	postHandles.postMetaById(context, postId).once(
		(postMeta: IPostMetasCallback) => {
			if (!postMeta || !Object.keys(postMeta).length) {
				return callback(
					new ApiError('failed, no post was found with this id', {
						initialRequestBody: { postId },
					}),
				);
			}
			const { postPath } = postMeta;

			getPostByPath(context, { postPath }, callback);
		},
		{ wait: 500 },
	);
};

/**
 * meta shape
 * 123123|hf8ef-fesj8f3-fesf
 * .keys().map(split(|))
 * {timestamp: 123123, id: 1jfisjfish}
 * .sort(timestamp)
 * indexOf(offset) + limit
 */
const getPostsTimestampIds = (
	context: IContext,
	{ token, limit }: { token?: string; limit: number },
	callback: IGunCallback<
		{ nextToken: string; postIds: string[]; canLoadMore: boolean } | undefined
	>,
) => {
	const lastItem = token ? JSON.parse(Base64.decode(token)) : null;
	const mainRunner = () => {
		profileHandles.currentProfileFriendsRecord(context).once(
			(friendsCallback: { [prop: string]: any }) => {
				if (!friendsCallback) {
					return callback(null, undefined);
				}
				const { _, ...rest } = friendsCallback;
				const friendsAliases = Object.keys(rest).filter((key) => rest[key] !== null);

				loadLimitedPosts(friendsAliases);
			},
			{ wait: 200 },
		);
	};
	const loadLimitedPosts = (friends: string[]) => {
		postHandles.postMetaByIdTimestampRecord(context).once(
			(itemsCallback: { [prop: string]: any }) => {
				console.log('itemsCallback', { itemsCallback });
				if (!itemsCallback) {
					return callback(null, undefined);
				}
				const { _, ...rest } = itemsCallback;
				// [{timestamp: 123123, postId: 'asduo3-fshefi}]
				const postsIdsAndTimestamps = Object.keys(rest)
					.filter((key) => rest[key] !== null)
					.map((item: string) => {
						const idTimestamp = item.split('|');
						return {
							timestamp: parseInt(idTimestamp[0], undefined),
							postId: idTimestamp[1],
							owner: idTimestamp[2],
						};
					})
					.filter((item: any) => !friends.includes(item.owner))
					.sort((a, b) => {
						return a.timestamp - b.timestamp;
					});
				console.log('postsIdsAndTimestamp', { postsIdsAndTimestamps });
				findOffsetAndLoad(postsIdsAndTimestamps);
			},
			{ wait: 500 },
		);
	};

	const findOffsetAndLoad = (postIdTimestamps: Array<{ timestamp: number; postId: string }>) => {
		const postIds = [];
		let canLoadMore = true;
		let loadLimit = limit;

		if (postIdTimestamps.length < limit) {
			canLoadMore = false;
			loadLimit = postIdTimestamps.length;
		}
		if (!lastItem) {
			for (let i = 0; i < loadLimit; i++) {
				postIds.push(postIdTimestamps[i].postId);
			}
			const nextToken = Base64.encode(JSON.stringify(postIdTimestamps[loadLimit - 1]));

			return callback(null, { nextToken, postIds, canLoadMore });
			console.log('loadRetOffi', { nextToken, postIds, canLoadMore });
		} else {
			const startIndex = postIdTimestamps.indexOf(lastItem);

			if (postIdTimestamps.length - startIndex < limit) {
				canLoadMore = false;
				loadLimit = postIdTimestamps.length;
			}
			for (let i = startIndex; i < loadLimit; i++) {
				postIds.push(postIdTimestamps[i].postId);
			}
			const nextToken = Base64.encode(JSON.stringify(postIdTimestamps[startIndex + loadLimit - 1]));
			console.log('loadRetOffn', { nextToken, postIds, canLoadMore });

			return callback(null, { nextToken, postIds, canLoadMore });
		}
	};
	mainRunner();
};

const getFriendsPostsTimestampIds = (
	context: IContext,
	{ token, limit }: { token?: string; limit: number },
	callback: IGunCallback<
		{ nextToken: string; postIds: string[]; canLoadMore: boolean } | undefined
	>,
) => {
	const lastItem = token ? JSON.parse(Base64.decode(token)) : null;
	const mainRunner = () => {
		profileHandles.currentProfileFriendsRecord(context).once(
			(friendsCallback: { [prop: string]: any }) => {
				if (!friendsCallback) {
					return callback(null, undefined);
				}
				const { _, ...rest } = friendsCallback;
				const friendsAliases = Object.keys(rest).filter((key) => rest[key] !== null);

				loadLimitedPosts(friendsAliases);
			},
			{ wait: 200 },
		);
	};

	const loadLimitedPosts = (friends: string[]) => {
		postHandles.postMetaByIdTimestampRecord(context).once(
			(itemsCallback: { [prop: string]: any }) => {
				console.log('itemsCallback', { itemsCallback });
				if (!itemsCallback) {
					return callback(null, undefined);
				}
				const { _, ...rest } = itemsCallback;
				// [{timestamp: 123123, postId: 'asduo3-fshefi}]
				const postsIdsAndTimestamps = Object.keys(rest)
					.filter((key) => rest[key] !== null)
					.map((item: string) => {
						const idTimestamp = item.split('|');
						return {
							timestamp: parseInt(idTimestamp[0], undefined),
							postId: idTimestamp[1],
							owner: idTimestamp[2],
						};
					})
					.filter((item: any) => friends.includes(item.owner))
					.sort((a, b) => {
						return a.timestamp - b.timestamp;
					});
				console.log('postsIdsAndTimestamp', { postsIdsAndTimestamps });
				findOffsetAndLoad(postsIdsAndTimestamps);
			},
			{ wait: 500 },
		);
	};

	const findOffsetAndLoad = (postIdTimestamps: Array<{ timestamp: number; postId: string }>) => {
		const postIds = [];
		let canLoadMore = true;
		let loadLimit = limit;

		if (postIdTimestamps.length < limit) {
			canLoadMore = false;
			loadLimit = postIdTimestamps.length;
		}
		if (!lastItem) {
			for (let i = 0; i < loadLimit; i++) {
				postIds.push(postIdTimestamps[i].postId);
			}
			const nextToken = Base64.encode(JSON.stringify(postIdTimestamps[loadLimit - 1]));

			return callback(null, { nextToken, postIds, canLoadMore });
			console.log('loadRetOffi', { nextToken, postIds, canLoadMore });
		} else {
			const startIndex = postIdTimestamps.indexOf(lastItem);

			if (postIdTimestamps.length - startIndex < limit) {
				canLoadMore = false;
				loadLimit = postIdTimestamps.length;
			}
			for (let i = startIndex; i < loadLimit; i++) {
				postIds.push(postIdTimestamps[i].postId);
			}
			const nextToken = Base64.encode(JSON.stringify(postIdTimestamps[startIndex + loadLimit - 1]));
			console.log('loadRetOffn', { nextToken, postIds, canLoadMore });

			return callback(null, { nextToken, postIds, canLoadMore });
		}
	};
	mainRunner();
};

export default {
	getPostsTimestampIds,
	getFriendsPostsTimestampIds,
	getPostByPath,
	getPostById,
	getPostPathsByUser,
	fastGetPostByPath,
};
