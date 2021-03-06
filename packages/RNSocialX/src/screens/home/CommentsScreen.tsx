import React, { Component } from 'react';
import { Platform } from 'react-native';
import AndroidKeyboardAdjust from 'react-native-android-keyboard-adjust';

import {
	IWithCommentsEnhancedActions,
	IWithCommentsEnhancedData,
	WithComments,
} from '../../enhancers/screens';

import { OS_TYPES } from '../../environment/consts';
import { INavigationProps } from '../../types';

import { CommentsScreenView } from './CommentsScreen.view';

type IProps = INavigationProps & IWithCommentsEnhancedData & IWithCommentsEnhancedActions;

class Screen extends Component<IProps> {
	public componentDidMount() {
		if (Platform.OS === OS_TYPES.Android) {
			AndroidKeyboardAdjust.setAdjustResize();
		}
	}

	public componentWillUnmount() {
		if (Platform.OS === OS_TYPES.Android) {
			AndroidKeyboardAdjust.setAdjustNothing();
		}
	}

	public render() {
		const { postId, keyboardRaised, navigation } = this.props;

		return (
			<CommentsScreenView postId={postId} keyboardRaised={keyboardRaised} navigation={navigation} />
		);
	}
}

export const CommentsScreen = (props: INavigationProps) => (
	<WithComments navigation={props.navigation}>
		{({ data, actions }) => <Screen {...props} {...data} {...actions} />}
	</WithComments>
);
