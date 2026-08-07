/* eslint-disable @next/next/no-img-element */

import { Activity, Data } from "@/utils/LanyardTypes";
import { Badges, UnknownIconDark, UnknownIconLight } from "@/utils/badges";
import { adjustTextColor, elapsedTime, getFlags, getImageDataUri, isHexColor } from "@/utils/helpers";
import { ProfileSettings } from "@/utils/parameters";
import React, { DetailedHTMLProps, HTMLAttributes } from "react";

const THEME_COLORS: Record<string, { bg: string; ink: string; muted: string }> = {
  dark: { bg: "0a0a12", ink: "#e8e8ec", muted: "#9a9aa8" },
  light: { bg: "ffffff", ink: "#111111", muted: "#555555" },
};

interface ProfileCardProps {
  settings: ProfileSettings;
  data: Data;
  images: {
    avatar: string | null;
    avatarDecoration: string | null;
    clanBadge: string | null;
    activityImages: Array<{ largeImage: string | null; smallImage: string | null }>;
    userEmoji: string | null;
    albumCover: string | null;
  };
}

export const ProfileCard: React.FC<ProfileCardProps> = ({
  settings,
  data,
  images,
}: ProfileCardProps) => {
  const {
    hideStatus,
    hideTimestamp,
    hideBadges,
    hideProfile,
    hideActivity,
    hideSpotify,
    hideAppleMusic,
    hideTag,
    hideDecoration,
    ignoreAppId,
    hideDiscrim,
    showDisplayName,
    theme = "dark",
    bg,
    textColor,
    borderColor,
    clanBackgroundColor,
    borderRadius = "10px",
    idleMessage = "I'm not currently doing anything!",
    fontScale = 1,
    cardWidth,
    cardHeight,
  } = settings;

  const {
    avatar,
    avatarDecoration,
    clanBadge,
    activityImages,
    userEmoji,
    albumCover,
  } = images;

  const colors = THEME_COLORS[theme] ?? THEME_COLORS.dark;
  const isDark = theme !== "light";
  const fs = Math.min(1, Math.max(0.75, fontScale));

  // `bg` doubles as either a bare hex color or any raw CSS `background`
  // value (a gradient, a named color, etc) -- backgroundColor stays a plain
  // hex for the one spot that can't take a gradient (the avatar status-ring
  // border), background is what actually paints the card.
  let avatarBorderColor: string = "#747F8D";
  const backgroundColor: string = bg && isHexColor(bg) ? bg.replace("#", "") : colors.bg;
  const background: string = bg ? (isHexColor(bg) ? `#${bg.replace("#", "")}` : bg) : `#${colors.bg}`;

  const primaryTextColor = textColor ? `#${textColor}` : colors.ink;
  const secondaryTextColor = textColor ? `#${adjustTextColor(textColor, theme, 20)}` : colors.muted;

  switch (data.discord_status) {
    case "online":
      avatarBorderColor = "#43B581";
      break;
    case "idle":
      avatarBorderColor = "#FAA61A";
      break;
    case "dnd":
      avatarBorderColor = "#F04747";
      break;
    case "offline":
      avatarBorderColor = "#747F8D";
      break;
  }

  const flags: string[] = getFlags(data.discord_user.public_flags);
  if (data.discord_user.avatar && data.discord_user.avatar.includes("a_"))
    flags.push("Nitro");

  let userStatus: Activity | null = null;
  if (data.activities[0] && data.activities[0].type === 4)
    userStatus = data.activities[0];

  const activities = data.activities
    // Filter only type 0
    .filter((activity) => activity.type === 0)
    // Filter ignored app ID
    .filter(
      (activity) => !ignoreAppId?.includes(activity.application_id ?? "")
    );

  // Non-Spotify listening activity (e.g. Apple Music via discord-music-presence)
  const musicActivity: Activity | undefined = !data.listening_to_spotify
    ? data.activities.find((a) => a.type === 2)
    : undefined;
  const isAppleMusic = musicActivity?.name === "Apple Music";
  const showMusicActivity = !!(musicActivity && !(isAppleMusic && hideAppleMusic));

  const hasSpotify = data.listening_to_spotify && !hideSpotify;
  const hasAnyListening = hasSpotify || showMusicActivity;

  const showActivitySection =
    hideActivity !== true &&
    !(hideActivity === "whenNotUsed" && activities.length === 0 && !hasAnyListening);

  const ACTIVITY_BLOCK_H = 120;

  // Height depends on what's actually going to render: every visible
  // activity block, plus one more if there's Spotify or another music
  // activity to show alongside them.
  const activitySectionH = (() => {
    if (!showActivitySection) return 0;

    let h = 0;
    if (activities.length > 0) h += activities.length * ACTIVITY_BLOCK_H;
    if (hasSpotify || showMusicActivity) h += ACTIVITY_BLOCK_H;
    if (activities.length === 0 && !hasSpotify && !showMusicActivity) h = 150; // idle message

    return h;
  })();

  const height = (() => {
    if (hideProfile && activitySectionH === 0) return "40";
    if (hideProfile) return String(activitySectionH + 20);
    if (activitySectionH === 0) return "91";
    return String(100 + activitySectionH);
  })();

  // Calculate height of main div element
  const divHeight = String(Number(height) - 10 - (borderColor ? 2 : 0));

  // cardWidth/cardHeight resize the rendered SVG without touching any of the
  // pixel math above -- the internal layout stays at its natural size and the
  // outer <svg> just scales it via the viewBox-to-viewport ratio. Given only
  // one of the two, the other follows proportionally; given both, the card
  // is stretched to exactly that box (which can distort avatars/icons if the
  // ratio is far from natural).
  const naturalWidth = 410;
  const naturalHeight = Number(height);
  const outputWidth = cardWidth ?? (cardHeight ? Math.round(naturalWidth * (cardHeight / naturalHeight)) : naturalWidth);
  const outputHeight = cardHeight ?? (cardWidth ? Math.round(naturalHeight * (cardWidth / naturalWidth)) : naturalHeight);

  const ForeignDiv = (
    props: DetailedHTMLProps<
      HTMLAttributes<HTMLDivElement> & { xmlns: string },
      HTMLDivElement
    >
  ) => <div {...props}>{props.children}</div>;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={outputWidth}
      height={outputHeight}
      viewBox={`0 0 ${naturalWidth} ${naturalHeight}`}
      preserveAspectRatio={cardWidth && cardHeight ? "none" : "xMidYMid meet"}
    >
      <foreignObject x="0" y="0" width={naturalWidth} height={naturalHeight}>
        <ForeignDiv
          xmlns="http://www.w3.org/1999/xhtml"
          style={{
            position: "absolute",
            width: borderColor ? "398px" : "400px",
            height: `${divHeight}px`,
            inset: 0,
            background,
            color: primaryTextColor,
            fontFamily: `'Century Gothic', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`,
            fontSize: `${16 * fs}px`,
            display: "flex",
            flexDirection: "column",
            padding: "5px",
            borderRadius: borderRadius,
            ...(borderColor ? { border: `1px solid #${borderColor}` } : {}),
          }}
        >
          {!hideProfile ? (
            <div
              style={{
                width: "400px",
                height: "100px",
                inset: 0,
                display: "flex",
                flexDirection: "row",
                paddingBottom: "5px",
                borderBottom: !showActivitySection
                  ? "none"
                  : `solid 0.5px ${
                      isDark
                        ? "hsl(0, 0%, 100%, 10%)"
                        : "hsl(0, 0%, 0%, 10%)"
                    }`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  position: "relative",
                  flexDirection: "row",
                  height: "80px",
                  width: "80px",
                }}
              >
                <img
                  src={getImageDataUri(avatar)}
                  alt="User Avatar"
                  style={{
                    borderRadius: "50%",
                    width: "50px",
                    height: "50px",
                    position: "relative",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                  }}
                />

                {hideDecoration ||
                !data.discord_user.avatar_decoration_data ? null : (
                  <>
                    <img
                      src={getImageDataUri(avatarDecoration)}
                      alt="Avatar Decoration"
                      style={{
                        display: "block",
                        width: "64px",
                        height: "64px",
                        position: "absolute",
                        top: " 50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                      }}
                    />
                  </>
                )}

                <span
                  style={{
                    position: "absolute",
                    bottom: "14px",
                    right: "14px",
                    height: "13px",
                    width: "13px",
                    backgroundColor: avatarBorderColor,
                    borderRadius: "50%",
                    border: `3px solid #${backgroundColor}`,
                  }}
                />
              </div>

              <div
                style={{
                  height: "80px",
                  width: "260px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    height: "25px",
                  }}
                >
                  <h1
                    style={{
                      fontSize: `${1.15 * fs}rem`,
                      margin: "0 12px 0 0",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {showDisplayName && data.discord_user.global_name
                      ? data.discord_user.global_name
                      : data.discord_user.username}

                    {!hideDiscrim && !showDisplayName ? (
                      <span
                        style={{
                          color: secondaryTextColor,
                          fontWeight: "lighter",
                        }}
                      >
                        #{data.discord_user.discriminator}
                      </span>
                    ) : null}
                  </h1>

                  {hideTag ||
                  (!data.discord_user.primary_guild?.tag &&
                    !data.discord_user.primary_guild?.badge) ? null : (
                    <span
                      style={{
                        backgroundColor: clanBackgroundColor,
                        borderRadius: " 0.375rem",
                        paddingLeft: "0.5rem",
                        paddingRight: "0.5rem",
                        marginLeft: "-6px",
                        marginRight: "12px",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.25rem",
                        fontSize: `${1 * fs}rem`,
                        fontWeight: "500",
                        fontFamily: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`,
                        height: "100%",
                      }}
                    >
                      <img
                        src={getImageDataUri(clanBadge)}
                        alt="Clan Badge"
                        style={{
                          width: "16px",
                          height: "16px",
                        }}
                      />
                      <p
                        style={{ marginBottom: "1.1rem", whiteSpace: "nowrap" }}
                      >
                        {data.discord_user.primary_guild.tag}
                      </p>
                    </span>
                  )}

                  {!!hideBadges
                    ? null
                    : flags.map((v) => (
                        <img
                          key={v}
                          alt={v}
                          src={getImageDataUri(Badges[v])}
                          style={{
                            width: "auto",
                            height: "20px",
                            position: "relative",
                            top: "50%",
                            transform: "translate(0%, -50%)",
                            marginRight: "7px",
                          }}
                        />
                      ))}
                </div>

                {showDisplayName ? (
                  <h2
                    style={{
                      fontSize: `${0.95 * fs}rem`,
                      margin: 0,
                      whiteSpace: "nowrap",
                      fontWeight: "400",
                    }}
                  >
                    {data.discord_user.username}
                  </h2>
                ) : null}
                {userStatus && !hideStatus ? (
                  <p
                    style={{
                      fontSize: `${0.9 * fs}rem`,
                      margin: 0,
                      color: secondaryTextColor,
                      fontWeight: 400,
                      overflow: "hidden",
                      whiteSpace: "nowrap",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {userStatus.emoji?.id ? (
                      <img
                        src={getImageDataUri(userEmoji)}
                        alt="User Status Emoji"
                        style={{
                          width: "15px",
                          height: "15px",
                          position: "relative",
                          top: "10px",
                          transform: "translate(0%, -50%)",
                          margin: "0 2px 0 0",
                        }}
                      />
                    ) : null}

                    {userStatus.state &&
                    userStatus.emoji?.name &&
                    !userStatus.emoji.id
                      ? `${userStatus.emoji.name} ${userStatus.state}`
                      : userStatus.state
                      ? userStatus.state
                      : !userStatus.state &&
                        userStatus.emoji?.name &&
                        !userStatus.emoji.id
                      ? userStatus.emoji.name
                      : null}
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}

          {activities.length > 0 && showActivitySection
            ? activities.map((activity, index) => {
                const activityPlatformRaw = activity.platform?.toLowerCase() ?? null;
                const isPlayStationPlatform = !!(
                  activityPlatformRaw &&
                  (activityPlatformRaw.startsWith("ps") || activityPlatformRaw.includes("playstation"))
                );
                const isXboxPlatform = !!(activityPlatformRaw && activityPlatformRaw.includes("xbox"));
                const activityPlatformLabel = activityPlatformRaw
                  ? isPlayStationPlatform
                    ? activityPlatformRaw.startsWith("ps")
                      ? activityPlatformRaw.toUpperCase()
                      : "PlayStation"
                    : isXboxPlatform
                    ? "Xbox"
                    : activityPlatformRaw.toUpperCase()
                  : null;
                const activityPlatformIconKind = isPlayStationPlatform
                  ? "playstation"
                  : isXboxPlatform
                  ? "xbox"
                  : "generic";
                const largeImage = activityImages[index]?.largeImage ?? null;
                const smallImage = activityImages[index]?.smallImage ?? null;

                return (
                  <div
                    key={activity.id || activity.application_id || index}
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      height: `${ACTIVITY_BLOCK_H}px`,
                      marginLeft: "15px",
                      fontSize: `${0.75 * fs}rem`,
                      paddingTop: "18px",
                    }}
                  >
                    <div
                      style={{
                        marginRight: "15px",
                        width: "auto",
                        height: "auto",
                      }}
                    >
                      {largeImage ? (
                        <img
                          src={getImageDataUri(largeImage)}
                          alt="Activity Large Image"
                          style={{
                            width: "80px",
                            height: "80px",
                            border: "solid 0.5px #222",
                            borderRadius: "10px",
                          }}
                        />
                      ) : (
                        <img
                          src={getImageDataUri(isDark ? UnknownIconLight : UnknownIconDark)}
                          alt="Unknown Icon"
                          style={{
                            width: "70px",
                            height: "70px",
                            marginTop: "4px",
                          }}
                        />
                      )}

                      {largeImage && smallImage ? (
                        <img
                          src={getImageDataUri(smallImage)}
                          alt="Activity Small Image"
                          style={{
                            width: "30px",
                            height: "30px",
                            borderRadius: "50%",
                            marginLeft: "-26px",
                            marginBottom: "-8px",
                          }}
                        />
                      ) : null}
                    </div>

                    <div
                      style={{
                        color: "#999",
                        marginTop:
                          activity.timestamps?.start && !hideTimestamp ? "-6px" : "5px",
                        lineHeight: "1",
                        width: "279px",
                      }}
                    >
                      <p
                        style={{
                          color: primaryTextColor,
                          fontSize: `${0.85 * fs}rem`,
                          fontWeight: "bold",
                          overflow: "hidden",
                          whiteSpace: "nowrap",
                          textOverflow: "ellipsis",
                          height: "15px",
                          margin: "7px 0",
                        }}
                      >
                        {activity.name}
                      </p>
                      {activityPlatformLabel ? (
                        <p
                          style={{
                            color: secondaryTextColor,
                            overflow: "hidden",
                            whiteSpace: "nowrap",
                            fontSize: `${0.78 * fs}rem`,
                            textOverflow: "ellipsis",
                            height: "15px",
                            margin: "7px 0",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: "15px",
                              height: "15px",
                            }}
                          >
                            {activityPlatformIconKind === "playstation" ? (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                width="15"
                                height="15"
                                aria-label="PlayStation"
                                style={{ display: "block" }}
                              >
                                <circle cx="12" cy="12" r="12" fill="#0f6bdc" />
                                <path
                                  d="M9 5h2.4c2 0 3.4 1.1 3.4 2.8v2.8c0 1.7-1.4 2.8-3.4 2.8H11v5H9V5Zm2 1.8v4.8h.5c.9 0 1.3-.3 1.3-1V7.8c0-.7-.4-1-1.3-1H11Zm-4.6 7.6 8.3-2.3v1.8l-5.2 1.6c-.6.2-.7.4-.1.6l2.5.8v1.7L7 17.4c-1.7-.5-1.9-2-1.6-3Z"
                                  fill="#fff"
                                />
                              </svg>
                            ) : activityPlatformIconKind === "xbox" ? (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                width="15"
                                height="15"
                                aria-label="Xbox"
                                style={{ display: "block" }}
                              >
                                <circle cx="12" cy="12" r="12" fill="#107c10" />
                                <path d="M7.2 7.2C8.4 6.3 10.1 5.8 12 5.8c1.9 0 3.6.5 4.8 1.4L12 12 7.2 7.2Z" fill="#fff" />
                                <path d="M6.3 8.8 10.9 13.4 7.2 17.1c-.6-.6-1.1-1.4-1.4-2.3-.5-1.4-.3-3 .5-4Z" fill="#fff" />
                                <path d="M17.7 8.8 13.1 13.4l3.7 3.7c.6-.6 1.1-1.4 1.4-2.3.5-1.4.3-3-.5-4Z" fill="#fff" />
                              </svg>
                            ) : (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                width="15"
                                height="15"
                                aria-label="Game Platform"
                                style={{ display: "block" }}
                              >
                                <circle cx="12" cy="12" r="12" fill={isDark ? "#444" : "#888"} />
                                <path
                                  d="M8.2 9.5h7.6c2 0 3.3 2.1 2.4 3.9l-1.1 2.1c-.6 1.1-2 1.5-3.1.9l-2-1.1-2 1.1c-1.1.6-2.5.2-3.1-.9l-1.1-2.1c-.9-1.8.4-3.9 2.4-3.9Zm1.3 1.9v1h-1v1h1v1h1v-1h1v-1h-1v-1h-1Zm4.9 1.2a.8.8 0 1 0 0 1.6.8.8 0 0 0 0-1.6Zm1.9-1.2a.8.8 0 1 0 0 1.6.8.8 0 0 0 0-1.6Z"
                                  fill="#fff"
                                />
                              </svg>
                            )}
                          </span>
                          {activityPlatformLabel}
                        </p>
                      ) : null}
                      {activity.details ? (
                        <p
                          style={{
                            color: secondaryTextColor,
                            overflow: "hidden",
                            whiteSpace: "nowrap",
                            fontSize: `${0.85 * fs}rem`,
                            textOverflow: "ellipsis",
                            height: "15px",
                            margin: "7px 0",
                          }}
                        >
                          {activity.details}
                        </p>
                      ) : null}
                      {activity.state ? (
                        <p
                          style={{
                            color: secondaryTextColor,
                            overflow: "hidden",
                            whiteSpace: "nowrap",
                            fontSize: `${0.85 * fs}rem`,
                            textOverflow: "ellipsis",
                            height: "15px",
                            margin: "7px 0",
                          }}
                        >
                          {activity.state}
                        </p>
                      ) : null}
                      {activity.timestamps?.start && !hideTimestamp ? (
                        <p
                          style={{
                            color: secondaryTextColor,
                            overflow: "hidden",
                            whiteSpace: "nowrap",
                            fontSize: `${0.85 * fs}rem`,
                            textOverflow: "ellipsis",
                            height: "15px",
                            margin: "7px 0",
                          }}
                        >
                          {elapsedTime(new Date(activity.timestamps.start).getTime())} elapsed
                        </p>
                      ) : null}
                    </div>
                  </div>
                );
              })
            : null}
          {hasSpotify && showActivitySection ? (
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                height: `${ACTIVITY_BLOCK_H}px`,
                marginLeft: "15px",
                fontSize: `${0.8 * fs}rem`,
                paddingTop: "18px",
              }}
            >
              <img
                src={getImageDataUri(albumCover ?? (isDark ? UnknownIconLight : UnknownIconDark))}
                alt="Album Cover"
                style={{
                  border: data.spotify.album_art_url ? "border: solid 0.5px #222" : undefined,
                  width: "80px",
                  height: "80px",
                  borderRadius: "10px",
                  marginRight: "15px",
                }}
              />

              <div
                style={{
                  color: "#999",
                  marginTop: "-3px",
                  lineHeight: "1",
                  width: "279px",
                }}
              >
                <p
                  style={{
                    fontSize: `${0.75 * fs}rem`,
                    fontWeight: "bold",
                    color: isDark ? "#1CB853" : "#0d943d",
                    marginBottom: "15px",
                    textTransform: "uppercase",
                  }}
                >
                  Listening to Spotify...
                </p>
                <p
                  style={{
                    height: "15px",
                    color: primaryTextColor,
                    fontWeight: "bold",
                    fontSize: `${0.85 * fs}rem`,
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    textOverflow: "ellipsis",
                    margin: "7px 0",
                  }}
                >
                  {data.spotify.song}
                </p>
                <p
                  style={{
                    margin: "7px 0",
                    height: "15px",
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    fontSize: `${0.85 * fs}rem`,
                    textOverflow: "ellipsis",
                    color: secondaryTextColor,
                  }}
                >
                  By {data.spotify.artist.replace(/; /g, ", ")}
                </p>
              </div>
            </div>
          ) : null}
          {showMusicActivity && showActivitySection ? (
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                height: `${ACTIVITY_BLOCK_H}px`,
                marginLeft: "15px",
                fontSize: `${0.8 * fs}rem`,
                paddingTop: "18px",
              }}
            >
              <img
                src={getImageDataUri(albumCover ?? (isDark ? UnknownIconLight : UnknownIconDark))}
                alt="Album Cover"
                style={{
                  border: musicActivity!.assets?.large_image ? "solid 0.5px #222" : undefined,
                  width: "80px",
                  height: "80px",
                  borderRadius: "10px",
                  marginRight: "15px",
                }}
              />

              <div
                style={{
                  color: "#999",
                  marginTop: "-3px",
                  lineHeight: "1",
                  width: "279px",
                }}
              >
                <p
                  style={{
                    fontSize: `${0.75 * fs}rem`,
                    fontWeight: "bold",
                    color: isAppleMusic
                      ? isDark ? "#FA243C" : "#d42135"
                      : isDark ? "#9B59B6" : "#7d3c98",
                    marginBottom: "15px",
                    textTransform: "uppercase",
                  }}
                >
                  Listening to {musicActivity!.name}...
                </p>
                <p
                  style={{
                    height: "15px",
                    color: primaryTextColor,
                    fontWeight: "bold",
                    fontSize: `${0.85 * fs}rem`,
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    textOverflow: "ellipsis",
                    margin: "7px 0",
                  }}
                >
                  {musicActivity!.details}
                </p>
                <p
                  style={{
                    margin: "7px 0",
                    height: "15px",
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    fontSize: `${0.85 * fs}rem`,
                    textOverflow: "ellipsis",
                    color: secondaryTextColor,
                  }}
                >
                  By {musicActivity!.state?.replace(/; /g, ", ")}
                </p>
              </div>
            </div>
          ) : null}
          {showActivitySection &&
          activities.length === 0 &&
          !hasSpotify &&
          !showMusicActivity ? (
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                height: "150px",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <p
                style={{
                  fontStyle: "italic",
                  fontSize: `${0.8 * fs}rem`,
                  color: secondaryTextColor,
                  height: "auto",
                  textAlign: "center",
                }}
              >
                {idleMessage}
              </p>
            </div>
          ) : null}
        </ForeignDiv>
      </foreignObject>
    </svg>
  );
};

export default ProfileCard;
