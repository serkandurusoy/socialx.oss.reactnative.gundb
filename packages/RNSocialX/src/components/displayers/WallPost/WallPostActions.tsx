import React from 'react';
import { View } from 'react-native';

import { IconButton, LikeAnimatingButton } from '../../';
import { ITranslatedProps } from '../../../types';
// import {Icons} from '../../../environment/theme';

import styles from './WallPostActions.style';

export interface IWallPostActions extends ITranslatedProps {
	likedByCurrentUser: boolean;
	likeFailed: boolean;
	numberOfSuperLikes: number;
	numberOfWalletCoins: number;
	onLikePress: () => void;
	onSuperLikePress: () => void;
	onCommentPress: () => void;
	onWalletCoinsButtonPress: () => void;
}

export const WallPostActions: React.SFC<IWallPostActions> = ({
	likedByCurrentUser,
	likeFailed,
	onLikePress,
	onCommentPress,
	getText,
}) => {
	return (
		<View style={styles.container}>
			{/* TODO: add when implmented: Socx Wallet / Post Total Rewards
				 <IconButton
					iconSource={Icons.iconPostWalletCoins}
					onPress={onWalletCoinsButtonPress}
					label={numberOfWalletCoins + ' SOCX'}
				/> */}

			<LikeAnimatingButton
				onLikePress={onLikePress}
				likedByCurrentUser={likedByCurrentUser}
				likeFailed={likeFailed}
				getText={getText}
			/>
			{/* TODO: add when implemented: SuperLikes
					 <IconButton
						iconSource={Icons.iconPostSuperLike}
						onPress={onSuperLikePress}
						label={umberOfSuperLikes.toString()}
                    /> */}
			<IconButton
				iconSource="comment-o"
				iconType="fa"
				onPress={onCommentPress}
				iconStyle={styles.icon}
			/>
		</View>
	);
};