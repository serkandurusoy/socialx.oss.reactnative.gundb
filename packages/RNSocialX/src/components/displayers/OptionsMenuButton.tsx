import * as React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

import { Colors, Sizes } from '../../environment/theme';

interface IOptionsMenuButtonProps {
	onPress: () => void;
	dark?: boolean;
	iconColor?: string;
	iconName?: string;
	disabled?: boolean;
}

export const OptionsMenuButton: React.SFC<IOptionsMenuButtonProps> = ({
	onPress,
	dark = false,
	iconColor = Colors.white,
	iconName = 'ios-more',
	disabled = false,
}) => (
	<TouchableOpacity onPress={onPress} disabled={disabled}>
		<Icon name={iconName} color={dark ? Colors.cloudBurst : iconColor} style={styles.icon} />
	</TouchableOpacity>
);

const styles: any = StyleSheet.create({
	icon: {
		fontSize: Sizes.smartHorizontalScale(25),
	},
});
