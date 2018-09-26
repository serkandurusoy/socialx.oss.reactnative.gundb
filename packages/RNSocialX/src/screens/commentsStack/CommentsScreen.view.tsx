import React from 'react';
import { Platform, SafeAreaView, ScrollView, TextInput } from 'react-native';

import {
	CommentCard,
	CommentsPostActions,
	CommentsPostLikes,
	CommentsPostOwner,
	CommentsPostText,
	CommentTextInput,
	NoComments,
} from '../../components';
import { WallPostMedia } from '../../components/displayers/WallPostCard';
import {
	IWithLoaderProps,
	WithInlineLoader,
} from '../../components/inlineLoader';
import {
	IMediaProps,
	IResizeProps,
	ITranslatedProps,
	IWallPostComment,
} from '../../types';
import style from './CommentsScreen.style';

const onStartCommentHandler = (commentInputRef: React.RefObject<TextInput>) => {
	if (commentInputRef.current) {
		commentInputRef.current.focus();
	}
};

const onCommentSendHandler = (
	commentInputRef: React.RefObject<TextInput>,
	onCommentSend: () => void,
) => {
	if (commentInputRef.current) {
		commentInputRef.current.blur();
	}
	onCommentSend();
};

interface ICommentsScreenComponentProps
	extends IWithLoaderProps,
		ITranslatedProps,
		IResizeProps {
	comments: IWallPostComment[];
	onCommentLike: (comment: IWallPostComment) => void;
	onCommentReply: (comment: IWallPostComment, startReply: boolean) => void;
	onCommentSend: () => void;
	onCommentTextChange: (commentText: string) => void;
	startComment: boolean;
	onViewUserProfile: (userId: string) => void;
	commentText: string;
	showSendButton: boolean;
	onShowOptionsMenu: (comment: IWallPostComment) => void;
	postData: any;
	postOwner: object;
	onCommentsBackPress: () => void;
	onImagePress: (index: any, medias: IMediaProps[]) => void;
	onLikePress: (likedByMe: boolean, postId: string) => void;
	currentUser: any;
	onCommentContainerWidthChange: (value: number) => void;
	commentLikesPosition: object;
	optionsProps: object;
	isReplyScreen: boolean;
}

export const CommentsScreenView: React.SFC<ICommentsScreenComponentProps> = ({
	comments,
	onCommentLike,
	onCommentReply,
	onCommentSend,
	startComment,
	onViewUserProfile,
	commentText,
	showSendButton,
	onCommentTextChange,
	onShowOptionsMenu,
	postData,
	postOwner,
	onCommentsBackPress,
	onImagePress,
	onLikePress,
	currentUser,
	getText,
	onCommentContainerWidthChange,
	commentLikesPosition,
	optionsProps,
	isLoading,
	marginBottom,
	isReplyScreen,
}) => {
	const { id, likes, media, text, timestamp } = postData;
	const likedByMe = !!likes.find(
		(like: any) => like.userId === currentUser.userId,
	);

	const noCommentsText = isReplyScreen
		? getText('replies.screen.no.comments')
		: getText('comments.screen.no.comments');
	const commentInputPlaceholder = isReplyScreen
		? getText('replies.screen.comment.input.placeholder')
		: getText('comments.screen.comment.input.placeholder');

	const scrollRef: React.RefObject<ScrollView> = React.createRef();
	const commentInputRef: React.RefObject<TextInput> = React.createRef();

	return (
		<SafeAreaView
			style={[style.container, Platform.select({ ios: { marginBottom } })]}
		>
			<WithInlineLoader isLoading={isLoading}>
				<ScrollView
					style={style.commentsList}
					keyboardShouldPersistTaps={'handled'}
					ref={scrollRef}
					onLayout={() => scrollRef.current && scrollRef.current.scrollToEnd()}
				>
					<CommentsPostOwner
						owner={postOwner}
						timestamp={timestamp}
						onBackPress={onCommentsBackPress}
						optionsProps={optionsProps}
						getText={getText}
						showUserProfile={onViewUserProfile}
					/>
					{text ? <CommentsPostText text={text} /> : null}
					{media && (
						<WallPostMedia
							mediaObjects={media}
							onMediaObjectView={(index: number) => onImagePress(index, media)}
							onLikeButtonPressed={() => {
								/**/
							}}
							// onLikeButtonPressed={this.onDoubleTapLikeHandler}
							noInteraction={false}
							getText={getText}
						/>
					)}
					<CommentsPostLikes
						getText={getText}
						likes={likes}
						showUserProfile={onViewUserProfile}
					/>
					<CommentsPostActions
						likedByMe={likedByMe}
						onLikePress={() => onLikePress(likedByMe, id)}
						getText={getText}
						onStartComment={() => onStartCommentHandler(commentInputRef)}
					/>
					{comments.length === 0 ? (
						<NoComments text={noCommentsText} />
					) : (
						comments.map((comment) => (
							<CommentCard
								key={comment.id}
								comment={comment}
								onCommentLike={() => onCommentLike(comment)}
								onCommentReply={(startReply: boolean) =>
									onCommentReply(comment, startReply)
								}
								onViewUserProfile={onViewUserProfile}
								onShowOptionsMenu={() => onShowOptionsMenu(comment)}
								onCommentContainerWidthChange={(width: number) =>
									onCommentContainerWidthChange(width)
								}
								commentLikesPosition={commentLikesPosition}
								getText={getText}
							/>
						))
					)}
				</ScrollView>
				<CommentTextInput
					ref={commentInputRef}
					autoFocus={startComment}
					onCommentSend={() =>
						onCommentSendHandler(commentInputRef, onCommentSend)
					}
					placeholder={commentInputPlaceholder}
					showSendButton={showSendButton}
					commentText={commentText}
					onCommentTextChange={onCommentTextChange}
				/>
			</WithInlineLoader>
		</SafeAreaView>
	);
};
