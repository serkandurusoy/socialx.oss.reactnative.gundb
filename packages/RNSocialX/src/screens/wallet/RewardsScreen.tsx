import moment from 'moment';
import numeral from 'numeral';
import * as React from 'react';
import { Animated, Easing, LayoutChangeEvent } from 'react-native';

import {
	IWithRewardsEnhancedActions,
	IWithRewardsEnhancedData,
	WithRewards,
} from '../../enhancers/screens';
import { IRewardsDate } from '../../environment/consts';
import { INavigationProps } from '../../types';
import { RewardsScreenView } from './RewardsScreen.view';

type IRewardsScreenProps = INavigationProps &
	IWithRewardsEnhancedActions &
	IWithRewardsEnhancedData;

interface IRewardsScreenState {
	selectedDateButton: IRewardsDate;
}

class Screen extends React.Component<IRewardsScreenProps, IRewardsScreenState> {
	public state = {
		selectedDateButton: IRewardsDate.daily,
	};

	private sliderWidth = 0;
	private translateX = new Animated.Value(0);

	public render() {
		const {
			totalAmountSOCX,
			referrals,
			posts,
			bounties,
			dailyHistory,
			monthlyHistory,
		} = this.props;

		const totalAmountSOCXFormatted = numeral(totalAmountSOCX).format('0.000a');

		const refBarWidth = new Animated.Value(parseFloat(this.props.referrals));
		const ptsBarWidth = new Animated.Value(parseFloat(this.props.posts));
		const bntsBarWidth = new Animated.Value(parseFloat(this.props.bounties));

		return (
			<RewardsScreenView
				onGoBack={this.onGoBackHandler}
				getText={this.props.getText}
				selectedDateButton={this.state.selectedDateButton}
				handleDateChange={this.handleDatChangeHandler}
				totalAmountSOCX={totalAmountSOCXFormatted}
				referralsAmount={referrals}
				refBarWidth={refBarWidth}
				postsAmount={posts}
				ptsBarWidth={ptsBarWidth}
				bountiesAmount={bounties}
				bntsBarWidth={bntsBarWidth}
				dailyHistory={dailyHistory}
				monthlyHistory={monthlyHistory}
				translateXValue={this.translateX}
				startDailyIndex={this.onSearchCurrentDay()}
				startMonthlyIndex={this.onSearchCurrentMonth()}
				dailyCarouselOnLayout={this.onDailyLayout}
			/>
		);
	}

	private onDailyLayout = (event: LayoutChangeEvent) => {
		this.sliderWidth = event.nativeEvent.layout.width;
	};

	private onSearchCurrentDay = () => {
		const currentDay = moment(new Date()).format('Do');
		const index = this.props.dailyHistory.findIndex((item) => item.date === currentDay);

		return index;
	};

	private onSearchCurrentMonth = () => {
		const currentMonth = moment(new Date()).format('MMM');
		const index = this.props.monthlyHistory.findIndex((item) => item.date === currentMonth);

		return index;
	};

	private handleDatChangeHandler = (buttonSelected: IRewardsDate) => {
		if (buttonSelected === IRewardsDate.daily) {
			this.setState({
				selectedDateButton: IRewardsDate.daily,
			});
			this.runSlideTransition(IRewardsDate.daily);
		}
		if (buttonSelected === IRewardsDate.monthly) {
			this.setState({
				selectedDateButton: IRewardsDate.monthly,
			});
			this.runSlideTransition(IRewardsDate.monthly);
		}
	};

	private runSlideTransition = (tab: IRewardsDate) => {
		const slideValue = tab === IRewardsDate.monthly ? -this.sliderWidth : -0;

		Animated.timing(this.translateX, {
			toValue: slideValue,
			easing: Easing.linear,
			duration: 300,
			isInteraction: false,
			useNativeDriver: true,
		}).start();
	};

	private onGoBackHandler = () => {
		this.props.navigation.goBack(null);
	};
}

export const RewardsScreen = (props: INavigationProps) => (
	<WithRewards>{({ data, actions }) => <Screen {...props} {...data} {...actions} />}</WithRewards>
);
