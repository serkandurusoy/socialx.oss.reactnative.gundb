import * as React from 'react';
import { FlatList, Image, Text, View } from 'react-native';

import { Header, Notification } from '../../components';
import { INotificationData, ITranslatedProps } from '../../types';

import styles, { emptyListIcon } from './NotificationsScreen.style';

interface INotificationsScreenViewProps extends ITranslatedProps {
	notifications: INotificationData[];
	refreshing: boolean;
	onRefresh: () => void;
	onSuperLikedPhotoPressed: (postId: string) => void;
	onFriendRequestApprove: (userName: string) => void;
	onFriendRequestDecline: (userName: string) => void;
	onGroupRequestApprove: (notificationId: string) => void;
	onGroupRequestDecline: (notificationId: string) => void;
	onViewUserProfile: (userId: string) => void;
}

const EmptyListComponent: React.SFC<ITranslatedProps> = ({ getText }) => (
	<View style={styles.emptyContainer}>
		<Image style={styles.noNotificationsIcon} source={emptyListIcon} resizeMode="contain" />
		<Text style={styles.noNotificationsText}>{getText('notifications.empty.list')}</Text>
	</View>
);

export const NotificationsScreenView: React.SFC<INotificationsScreenViewProps> = ({
	notifications,
	refreshing,
	onRefresh,
	onFriendRequestApprove,
	onFriendRequestDecline,
	onGroupRequestApprove,
	onGroupRequestDecline,
	onViewUserProfile,
	getText,
}) => (
	<View style={styles.container}>
		<Header title={getText('notifications.screen.title')} />
		<FlatList
			data={notifications}
			keyExtractor={(item: any) => item.notificationId}
			renderItem={(data) => (
				<Notification
					notification={data.item}
					onFriendRequestApprove={onFriendRequestApprove}
					onFriendRequestDecline={onFriendRequestDecline}
					onViewUserProfile={onViewUserProfile}
					onGroupRequestApprove={onGroupRequestApprove}
					onGroupRequestDecline={onGroupRequestDecline}
					getText={getText}
				/>
			)}
			ListEmptyComponent={<EmptyListComponent getText={getText} />}
			refreshing={refreshing}
			onRefresh={onRefresh}
		/>
	</View>
);
