## Important:

README.md file in this folder is autogenerated doc when `fastlane` command is run.
Please DO NOT install FastLane as described in there, rather see no. 2 in next section!

##One time setup for FastLane

1. First install bundler by running: `sudo gem install bundler`
2. From folder fastlane run `sudo bundle update`. This will install FastLane and CocoaPods using Gemfile and Gemfile.lock
3. The next steps are iOS specific and require macOS machine and Xcode 9.2+ installed. If not just skip steps 3 to 5.


## Building and distribution for iOS via TestFlight

1. In fastlane folder open script `distribute_ios.sh`, set values for version string and version code and run this script. 
The preconditions to build are:
- current branch starts with `beta/`
- local branch is clean, with no local changes

2. Build process has 5 steps (lanes), as can be seen in `fast.rb`
- install_dev lane: will do a clean install for project dependencies and build subprojects
- check_build_params lane: this will validate required input params for Fastlane build: version_code and version_string
- ios_build lane: will do the actual build and sign the iOS IPA file
- send_testflight lane: this will upload the IPA file to TestFlight for app with ID: `socialxnetwork`
- ios_bugsnag lane: this will execute script `./scripts/ios-bugsnag.sh` that uploads sourcemaps and minified JS file 
to BugSnag for error reporting. The script takes as input param app version as seen in 
[Bugsnag console](https://app.bugsnag.com/settings/socialx/projects/socialx/source-maps). 
Each platform has it's own version number so they will not overlap in any case. 

3. After build: you can commit the changes with the new version, on the beta branch.

## Building and distribution for Android via Google play beta

1. In fastlane folder open script `distribute_android.sh`, set values for version string and version code and run this script.
The preconditions to build are: 
- current branch starts with `beta/`
- local branch is clean, with no local changes

2. Build process has 5 steps (lanes), as can be seen in `fast.rb`, under platform :android lane :release. 
The logic of the lanes is very similar with lanes for iOS. 

3. After build: you can commit the changes with the new version, on the beta branch.

## Build and distribute both iOS and Android at once: TODO
