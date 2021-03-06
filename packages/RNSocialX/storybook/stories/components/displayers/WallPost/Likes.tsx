import { action } from '@storybook/addon-actions';
import { storiesOf } from '@storybook/react-native';
import * as React from 'react';

import { Likes } from '../../../../../src/components/displayers/WallPost';
import { getTextMock } from '../../../../../src/mocks';
import CenterView from '../../../../helpers/CenterView';

storiesOf('Components/displayers', module)
	.addDecorator((getStory: any) => <CenterView>{getStory()}</CenterView>)
	.add('Likes 1 like', () => (
		<Likes
			alias="alex"
			total={1}
			onUserPress={action('onUserPress')}
			onViewLikes={action('onViewLikes')}
			getText={getTextMock}
		/>
	))
	.add('RecentLikes 2 likes', () => (
		<Likes
			alias="alex"
			total={2}
			onUserPress={action('onUserPress')}
			onViewLikes={action('onViewLikes')}
			getText={getTextMock}
		/>
	))
	.add('RecentLikes 3+ likes', () => (
		<Likes
			alias="alex"
			total={3}
			onUserPress={action('onUserPress')}
			onViewLikes={action('onViewLikes')}
			getText={getTextMock}
		/>
	));
