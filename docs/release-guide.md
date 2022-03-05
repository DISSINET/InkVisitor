## Realease guide

## Branching strategy

_GitHub flow_ <https://guides.github.com/introduction/flow/> -- open a PR to master from a branch in your fork (what we already use).

## Creating a release

1. Create a tag (on master on a commit that should be the release), for example:

> git tag v0.1.0

2. Push a tag so that it appears on the repo github page (it's not uploaded with a regular git push)

> git push <remote> <tag_name>

(for example `git push upstream v0.1.0 `)

3. Create a release, at the github repo page on the left. Associate a release with the tag. Autogenerate release notes is a possibility, otherwise provide a description

4. Build and deploy from the tagged commit

## Moving a tag

For some specific situations (like build that requires new commits), you can move an existing tag:

> git tag -fa <tagname>
> git push <remote> <tag_name> --force

More on tagging <https://git-scm.com/book/en/v2/Git-Basics-Tagging>

## Versioning

Version number consits of three parts: `x.y.z`:

- x -- major release breaking backward-compatibility
- y -- planned releases introducing new features
- z -- bug fixes

Most likely we will most often do y releases. For a planned release just create a new tag (e.g. v0.2.0̈́) and release as described above. The z number should be reserved for hot fixes between planned releases.

## Hotfixes

Releases that fix high priority bugs/security issues that cannot wait until the next planned release. In such cases we don't want to release from master so that we don't publish any in-progress feature work that may have been created after the last planned release. Hotfix procedure:

1. fix the issue, create a PR and merge to master as usual. Notice the commit id

2. on master, move back to the commit associated with the latest tag

> git checkout <tag>

3. Create a branch from the tagged commit and checkout to it

> git checkout -b <branch-name>

4. cherrypick the fix from master

> git cherry-pick <commit>

5. Create a build, tag the commit with the z version, push the branch and create a release

# TODOs?

- releasever in ui -- some automated way <https://www.npmjs.com/package/git-tag-version>
- bumping realase version in package.js
- CI for staging deploys -- mirror master
- Testing
- db backup on release event
