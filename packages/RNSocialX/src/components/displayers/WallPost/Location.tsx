import * as React from 'react';
import { StyleSheet, Text } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

import { Colors, Sizes } from '../../../environment/theme';
import { ITranslatedProps } from '../../../types';

interface ILocationProps extends ITranslatedProps {
	location?: string;
}

export const Location: React.SFC<ILocationProps> = ({ location, getText }) => {
	if (location) {
		return (
			<React.Fragment>
				<Text style={styles.grayText}> {getText('text.at')} </Text>
				<Icon name="md-pin" size={Sizes.smartHorizontalScale(12)} color={Colors.paleSky} />
				<Text> {location}</Text>
			</React.Fragment>
		);
	}

	return null;
};

const styles: any = StyleSheet.create({
	grayText: {
		color: Colors.paleSky,
	},
});
