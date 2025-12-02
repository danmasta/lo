---
sidebar_position: 2
---
# Installation
## Install
### Reference a Tag or Commit
```sh
npm install lo@danmasta/lo#v0.0.5 --save
```
*Does not support sub-package installs for multiple conflicting versions*

### Reference a Semver Range
```sh
npm install lo@danmasta/lo#semver:0.0.5 --save
```
*Supports sub-package installs for multiple conflicting versions*

## Git Repos as Dependencies
You can install npm dependencies directly from [github](https://docs.npmjs.com/cli/v11/configuring-npm/package-json#github-urls). When [installing an npm package via git](https://docs.npmjs.com/cli/v11/configuring-npm/package-json#git-urls-as-dependencies), there are two different patterns for specifying versions:
* [Commit-ish](#commit-ish)
* [Semver](#semver)

### Commit-ish
You can use the version format `#<commit-ish>` to reference any commit directly. This could be a branch, tag, or commit sha:
```sh
#master
#v0.0.5
#99457d6
```
This pattern works great for most use cases where you are depending on the repo at the root of your application. However, if there are other dependencies which depend on the same repo, also using the commit-ish tag, then npm will only resolve the latest referenced commit and install one time. Any other sub-package versions are ignored.

If you are a library author, you should consider using the [semver](#semver) pattern instead, to ensure the correct sub-version can be installed regardless of any resolved version from the parent applicaton or other dependencies.

### Semver
You can use the version format `#semver:<range>` to reference any valid [semver range](https://docs.npmjs.com/cli/v11/configuring-npm/package-json#dependencies). Semver tags will be treated like regular npm dependencies and support sub-package installs for handling different versions. Npm will search the repo for tags or refs that match the range and install the latest satisfiable version if found.
```sh
#semver:0.0.5
```
