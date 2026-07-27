import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  DriftingImageDisc,
  isDiscVideo,
  type DiscImage,
} from "@/components/media/DriftingImageDisc/DriftingImageDisc";
import { SocialIconLinks } from "@/components/layout/SocialIconLinks";
import { Scene3DMount } from "@/components/media/Scene3DMount/Scene3DMount";
import { VideoEmbed } from "@/components/media/VideoEmbed/VideoEmbed";
import {
  getCategoryBySlug,
  IMMERSIVE_WORK_SLUG,
  INSTALLATION_SLUG,
  MOVING_IMAGE_SLUG,
} from "@/content/work/categories";
import {
  INSTALLATION_EXPERIENCE_HTML_FILENAME,
  INSTALLATION_EXPERIENCE_HTML_PATH,
  INSTALLATION_FEATURE_VIDEO_URL,
  INSTALLATION_GRID_STILL_PATH,
} from "@/content/work/installationMedia";
import {
  MOVING_IMAGE_GAZEGENE_STILL,
  MOVING_IMAGE_LIGHTBOX_COVERFLOW_PATHS,
  MOVING_IMAGE_POST_EDITING_IMG,
  MOVING_IMAGE_ROW1_VIDEO_URL,
  MOVING_IMAGE_ROW2_LIGHTBOX_COVERFLOW_PATHS,
  MOVING_IMAGE_ROW2_POST_EDITING_IMG,
  MOVING_IMAGE_ROW2_VIDEO_URL,
  MOVING_IMAGE_ROW3_VIDEO_URL,
  MOVING_IMAGE_ROW4_VIDEO_URL,
  MOVING_IMAGE_VERTICAL_STILL_PATHS,
} from "@/content/work/movingImageVideos";
import { getVideoWatchPageUrl } from "@/lib/video/embedUrl";
import { getProjectsByCategory } from "@/content/work/projects";
import { DRIFTING_PAGE_PATH, WORK_SPATIAL_VR_PATH } from "@/content/work/workPaths";
import { APP_VERSION, SITE_PUBLIC_HOST } from "@/site/version";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import "./CategoryPage.css";

function sortProjectIds(a: string, b: string) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

function MovingImageCardCaption({ title, meta }: { title: string; meta: string }) {
  return (
    <span className="moving-image-grid__caption" aria-hidden="true">
      <span className="moving-image-grid__caption-title">{title}</span>
      <span className="moving-image-grid__caption-meta">{meta}</span>
    </span>
  );
}

export function CategoryPage() {
  const { category } = useParams<{ category: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const meta = getCategoryBySlug(category);
  const list = useMemo(() => (category ? getProjectsByCategory(category) : []), [category]);
  const sortedList = useMemo(() => [...list].sort((x, y) => sortProjectIds(x.id, y.id)), [list]);
  /** Moving image：点击格子 → 全页悬浮层 16:9 播放（Pinterest 式）；Esc / 点遮罩关闭 */
  const [movingImageLightboxId, setMovingImageLightboxId] = useState<number | null>(null);
  /** Feature lightbox 底部圆盘：右侧大图预览 */
  const [mifDiscPreview, setMifDiscPreview] = useState<DiscImage | null>(null);
  /** Installation：与 moving-image 同套 feature lightbox */
  const [installationLightboxOpen, setInstallationLightboxOpen] = useState(false);
  const [installationDiscPreview, setInstallationDiscPreview] = useState<DiscImage | null>(null);

  const movingImageDiscGalleryRow1 = useMemo<DiscImage[]>(
    () =>
      MOVING_IMAGE_LIGHTBOX_COVERFLOW_PATHS.map((src, i) => ({
        src,
        alt: `Moving image — process ${i + 1}`,
      })),
    [],
  );

  const movingImageDiscGalleryRow2 = useMemo<DiscImage[]>(
    () =>
      MOVING_IMAGE_ROW2_LIGHTBOX_COVERFLOW_PATHS.map((src, i) => ({
        src,
        alt: `Moving image — row 2 — process ${i + 1}`,
      })),
    [],
  );

  const installationDiscGallery = useMemo<DiscImage[]>(
    () =>
      MOVING_IMAGE_LIGHTBOX_COVERFLOW_PATHS.map((src, i) => ({
        src,
        alt: `Installation — process ${i + 1}`,
      })),
    [],
  );

  const clearMovingImageOpenQuery = useCallback(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (!next.has("open") && !next.has("chapter")) return prev;
        next.delete("open");
        next.delete("chapter");
        return next;
      },
      { replace: true },
    );
  }, [setSearchParams]);

  const closeMovingImageLightbox = useCallback(() => {
    setMovingImageLightboxId(null);
    clearMovingImageOpenQuery();
  }, [clearMovingImageOpenQuery]);

  const clearInstallationOpenQuery = useCallback(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (!next.has("open")) return prev;
        next.delete("open");
        return next;
      },
      { replace: true },
    );
  }, [setSearchParams]);

  const closeInstallationLightbox = useCallback(() => {
    setInstallationLightboxOpen(false);
    clearInstallationOpenQuery();
  }, [clearInstallationOpenQuery]);

  /** `/moving-image?open=1|2`：从链接进入时打开对应全屏详情 */
  useEffect(() => {
    if (category !== MOVING_IMAGE_SLUG) return;
    const o = searchParams.get("open");
    if (o === "1") setMovingImageLightboxId(1);
    else if (o === "2") setMovingImageLightboxId(2);
  }, [category, searchParams]);

  /** `/installation?open=1`：与 moving-image 同套详情入口 */
  useEffect(() => {
    if (category !== INSTALLATION_SLUG) return;
    if (searchParams.get("open") === "1") setInstallationLightboxOpen(true);
  }, [category, searchParams]);

  useEffect(() => {
    if (movingImageLightboxId === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMovingImageLightbox();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [movingImageLightboxId, closeMovingImageLightbox]);

  useEffect(() => {
    if (!installationLightboxOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeInstallationLightbox();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [installationLightboxOpen, closeInstallationLightbox]);

  useEffect(() => {
    if (movingImageLightboxId === null) setMifDiscPreview(null);
  }, [movingImageLightboxId]);

  useEffect(() => {
    if (!installationLightboxOpen) setInstallationDiscPreview(null);
  }, [installationLightboxOpen]);

  useEffect(() => {
    if (movingImageLightboxId === null) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [movingImageLightboxId]);

  useEffect(() => {
    if (!installationLightboxOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [installationLightboxOpen]);

  /** Pointer-driven spotlight on panels (stacks with GlobalCursorGlow) */
  const onGlowPanelPointerMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / Math.max(rect.width, 1)) * 100;
    const y = ((e.clientY - rect.top) / Math.max(rect.height, 1)) * 100;
    el.style.setProperty("--glow-x", `${x}%`);
    el.style.setProperty("--glow-y", `${y}%`);
  }, []);

  if (!meta) {
    return (
      <section className="category-page category-page--empty">
        <h1 className="category-page__title">Unknown category</h1>
        <p className="category-page__lead">No category matches “{category}”.</p>
        <Link className="btn btn-outline" to="/">
          Home
        </Link>
      </section>
    );
  }

  if (meta.slug === MOVING_IMAGE_SLUG) {
    const row1Url = MOVING_IMAGE_ROW1_VIDEO_URL;
    const row2Url = MOVING_IMAGE_ROW2_VIDEO_URL;
    const row3Url = MOVING_IMAGE_ROW3_VIDEO_URL;
    const row4Url = MOVING_IMAGE_ROW4_VIDEO_URL;
    const [stillA, stillB, stillC] = MOVING_IMAGE_VERTICAL_STILL_PATHS;
    const lightboxVideo =
      movingImageLightboxId === 1
        ? { url: row1Url, title: "Moving image — row 1" }
        : movingImageLightboxId === 2
          ? { url: row2Url, title: "Moving image — row 2" }
          : undefined;
    const movingImageFeatureActive = movingImageLightboxId === 1 || movingImageLightboxId === 2;
    const dreamlandChapter = searchParams.get("chapter");
    const dreamlandChapterTitle =
      movingImageLightboxId === 2 && dreamlandChapter
        ? (
            {
              "1": "Chapter One",
              "2": "Chapter Two",
              "3": "Chapter Three",
            } as Record<string, string>
          )[dreamlandChapter] ?? null
        : null;
    return (
      <section className="category-page category-page--moving-image">
        <header className="category-page__head">
          <p className="category-page__kicker">Category</p>
          <h1 className="category-page__title">{meta.label}</h1>
          {meta.description.trim() ? <p className="category-page__lead">{meta.description}</p> : null}
        </header>

        <div className="moving-image-grid" aria-label="Moving image video grid">
          <div
            className="moving-image-grid__cell moving-image-grid__cell--r1-video"
            onClick={() => setMovingImageLightboxId(1)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setMovingImageLightboxId(1);
              }
            }}
            role="button"
            tabIndex={0}
            aria-label="Open video in full-page overlay"
          >
            <VideoEmbed url={row1Url} title="Moving image — row 1" />
            <MovingImageCardCaption title="Gazegene" meta="Film · 01" />
          </div>

          <div
            className="moving-image-grid__cell moving-image-grid__cell--gazegene"
            role="button"
            tabIndex={0}
            aria-label="Open video in full-page overlay"
            onClick={() => setMovingImageLightboxId(1)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setMovingImageLightboxId(1);
              }
            }}
          >
            <span className="moving-image-grid__gazegene-text" aria-hidden="true">
              <span className="moving-image-grid__gazegene-line">
                {"GAZE".split("").map((ch, i) => (
                  <span key={`gaze-${i}`} className="moving-image-grid__gazegene-char">
                    {ch}
                  </span>
                ))}
              </span>
              <span className="moving-image-grid__gazegene-line">
                {"GENE".split("").map((ch, i) => (
                  <span key={`gene-${i}`} className="moving-image-grid__gazegene-char">
                    {ch}
                  </span>
                ))}
              </span>
            </span>
            <img
              className="moving-image-grid__gazegene-photo"
              src={MOVING_IMAGE_GAZEGENE_STILL}
              alt=""
              decoding="async"
              loading="lazy"
            />
            <MovingImageCardCaption title="Gazegene" meta="Key visual · 01" />
          </div>

          <Link
            className="moving-image-grid__cell moving-image-grid__cell--still moving-image-grid__cell--still-1"
            to="?open=2&chapter=3"
            aria-label="Dreamland Trilogy — Chapter Three, open full detail"
          >
            <img className="moving-image-grid__still-img" src={stillA} alt="" decoding="async" loading="lazy" />
            <MovingImageCardCaption title="Dreamland Trilogy" meta="Chapter · 03" />
          </Link>
          <Link
            className="moving-image-grid__cell moving-image-grid__cell--still moving-image-grid__cell--still-2"
            to="?open=2&chapter=2"
            aria-label="Dreamland Trilogy — Chapter Two, open full detail"
          >
            <img className="moving-image-grid__still-img" src={stillB} alt="" decoding="async" loading="lazy" />
            <MovingImageCardCaption title="Dreamland Trilogy" meta="Chapter · 02" />
          </Link>
          <Link
            className="moving-image-grid__cell moving-image-grid__cell--still moving-image-grid__cell--still-3"
            to="?open=2&chapter=1"
            aria-label="Dreamland Trilogy — Chapter One, open full detail"
          >
            <img className="moving-image-grid__still-img" src={stillC} alt="" decoding="async" loading="lazy" />
            <MovingImageCardCaption title="Dreamland Trilogy" meta="Chapter · 01" />
          </Link>

          <div
            className="moving-image-grid__cell moving-image-grid__cell--r2-video"
            onClick={() => setMovingImageLightboxId(2)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setMovingImageLightboxId(2);
              }
            }}
            role="button"
            tabIndex={0}
            aria-label="Open video in full-page overlay"
          >
            <VideoEmbed url={row2Url} title="Moving image — row 2" />
            <MovingImageCardCaption title="Dreamland Trilogy" meta="Film · 02" />
          </div>

          <div className="moving-image-grid__cell moving-image-grid__cell--r3-video">
            <VideoEmbed url={row3Url} title="Moving image — row 3" />
            <MovingImageCardCaption title="Moving Image Study" meta="Film · 03" />
          </div>

          <div className="moving-image-grid__cell moving-image-grid__cell--r4-video">
            <VideoEmbed url={row4Url} title="Moving image — row 4" />
            <MovingImageCardCaption title="Moving Image Study" meta="Film · 04" />
          </div>
        </div>

        {typeof document !== "undefined" &&
          movingImageFeatureActive &&
          lightboxVideo &&
          createPortal(
            <div
              className="moving-image-lightbox moving-image-lightbox--feature"
              role="dialog"
              aria-modal="true"
              aria-label="Video playback"
              onClick={(e) => {
                if (e.target === e.currentTarget) closeMovingImageLightbox();
              }}
            >
              <button
                type="button"
                className="moving-image-lightbox__close moving-image-lightbox__close--feature"
                aria-label="Close"
                onClick={(e) => {
                  e.stopPropagation();
                  closeMovingImageLightbox();
                }}
              >
                ×
              </button>
              <aside className="moving-image-lightbox__social-dock" aria-label="Social media links">
                <SocialIconLinks compact vertical ariaLabel="Social media links" />
              </aside>
              <div
                className="moving-image-lightbox-feature"
                data-app-version={APP_VERSION}
                onClick={(e) => e.stopPropagation()}
              >
                <section className="mif-hero" aria-label="Hero video">
                  <div className="mif-hero__stage">
                    <VideoEmbed url={lightboxVideo.url} title={lightboxVideo.title} />
                  </div>
                  <p className="mif-hero__frame-label">
                    {movingImageLightboxId === 2
                      ? dreamlandChapterTitle
                        ? `${dreamlandChapterTitle} · Frame 1`
                        : "Frame 1"
                      : "Frame 4"}
                  </p>
                </section>

                <section className="mif-copy" aria-label="Description">
                  <div className="mif-copy__col">
                    <p className="mif-copy__block">
                      {movingImageLightboxId === 2
                        ? "Dreamland Trilogy — layout placeholder: narrative and scene notes go here. Replace when copy is ready."
                        : "Narrative structure and motion studies for the moving-image sequence. Placeholder copy for layout rhythm."}
                    </p>
                  </div>
                  <div className="mif-copy__col">
                    <p className="mif-copy__block">
                      {movingImageLightboxId === 2
                        ? "Second video detail uses the same grid as the first: hero, annotated still, disc gallery + preview. Swap images in movingImageVideos.ts."
                        : "Sound, edit, and character blocking notes. Replace with final project text when ready."}
                    </p>
                  </div>
                </section>

                <section className="mif-annotated" aria-label="Post Editing & Character Design">
                  <div className="mif-annotated__media">
                    <img
                      src={
                        movingImageLightboxId === 2
                          ? MOVING_IMAGE_ROW2_POST_EDITING_IMG
                          : MOVING_IMAGE_POST_EDITING_IMG
                      }
                      alt=""
                      className="mif-annotated__img"
                      decoding="async"
                    />
                  </div>
                </section>

                <section className="mif-disc-gallery" aria-label="Process gallery">
                  <div className="mif-disc-gallery__row">
                    <div className="mif-disc-gallery__disc">
                      <DriftingImageDisc
                        images={
                          movingImageLightboxId === 2
                            ? movingImageDiscGalleryRow2
                            : movingImageDiscGalleryRow1
                        }
                        onFrontImageChange={setMifDiscPreview}
                      />
                    </div>
                    <aside className="mif-disc-gallery__preview" aria-label="Preview">
                      {mifDiscPreview ? (
                        <figure className="mif-disc-gallery__figure">
                          {isDiscVideo(mifDiscPreview) ? (
                            <video
                              key={mifDiscPreview.src}
                              className="mif-disc-gallery__preview-video"
                              src={mifDiscPreview.src}
                              controls
                              playsInline
                              preload="metadata"
                              aria-label={mifDiscPreview.alt}
                            />
                          ) : (
                            <img
                              className="mif-disc-gallery__preview-img"
                              src={mifDiscPreview.src}
                              alt={mifDiscPreview.alt}
                              loading="lazy"
                              decoding="async"
                            />
                          )}
                        </figure>
                      ) : (
                        <p className="mif-disc-gallery__empty">转动圆盘时此处同步正面照片</p>
                      )}
                    </aside>
                  </div>
                </section>
              </div>
            </div>,
            document.body,
          )}

        {sortedList.length > 0 ? (
          <section className="category-page__list" aria-labelledby="projects-heading">
            <h2 id="projects-heading" className="category-page__block-title">
              Projects in this category
            </h2>
            <ul className="category-page__projects">
              {sortedList.map((p) => (
                <li key={p.id}>
                  <Link to={`/${meta.slug}/${p.id}`} className="category-page__project-link">
                    <span className="category-page__project-id">{p.id}</span>
                    {p.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </section>
    );
  }

  if (meta.slug === INSTALLATION_SLUG) {
    const installationVideoUrl = INSTALLATION_FEATURE_VIDEO_URL;
    const installationVideoTitle = `${meta.label} — video`;
    const installationVideoWatchUrl = getVideoWatchPageUrl(installationVideoUrl);
    return (
      <section className="category-page category-page--moving-image category-page--installation">
        <header className="category-page__head">
          <p className="category-page__kicker">Category</p>
          <h1 className="category-page__title">{meta.label}</h1>
          {meta.description.trim() ? <p className="category-page__lead">{meta.description}</p> : null}
        </header>

        <div className="moving-image-grid" aria-label="Installation video grid">
          <div
            className="moving-image-grid__cell moving-image-grid__cell--r1-video"
            onClick={() => {
              setInstallationLightboxOpen(true);
              setSearchParams(
                (prev) => {
                  const next = new URLSearchParams(prev);
                  next.set("open", "1");
                  return next;
                },
                { replace: true },
              );
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setInstallationLightboxOpen(true);
                setSearchParams(
                  (prev) => {
                    const next = new URLSearchParams(prev);
                    next.set("open", "1");
                    return next;
                  },
                  { replace: true },
                );
              }
            }}
            role="button"
            tabIndex={0}
            aria-label="Open installation video in full-page overlay"
          >
            <div className="moving-image-grid__video-stack">
              <VideoEmbed url={installationVideoUrl} title={installationVideoTitle} />
              {installationVideoWatchUrl ? (
                <a
                  className="moving-image-grid__watch-on-platform"
                  href={installationVideoWatchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  aria-label="在视频平台打开完整页面"
                >
                  前往平台观看
                </a>
              ) : null}
            </div>
          </div>

          <div className="moving-image-grid__cell moving-image-grid__cell--installation-still">
            <img
              className="moving-image-grid__installation-still-img"
              src={INSTALLATION_GRID_STILL_PATH}
              alt=""
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>

        <p className="category-page__installation-build" aria-label={`Site ${SITE_PUBLIC_HOST}`}>
          {SITE_PUBLIC_HOST}
        </p>

        {typeof document !== "undefined" &&
          installationLightboxOpen &&
          createPortal(
            <div
              className="moving-image-lightbox moving-image-lightbox--feature"
              role="dialog"
              aria-modal="true"
              aria-label="Video playback"
              onClick={(e) => {
                if (e.target === e.currentTarget) closeInstallationLightbox();
              }}
            >
              <button
                type="button"
                className="moving-image-lightbox__close moving-image-lightbox__close--feature"
                aria-label="Close"
                onClick={(e) => {
                  e.stopPropagation();
                  closeInstallationLightbox();
                }}
              >
                ×
              </button>
              <aside className="moving-image-lightbox__social-dock" aria-label="Social media links">
                <SocialIconLinks compact vertical ariaLabel="Social media links" />
              </aside>
              <div
                className="moving-image-lightbox-feature"
                data-app-version={APP_VERSION}
                onClick={(e) => e.stopPropagation()}
              >
                <section className="mif-hero" aria-label="Hero video">
                  <div className="mif-hero__stage">
                    <VideoEmbed url={installationVideoUrl} title={installationVideoTitle} />
                    {installationVideoWatchUrl ? (
                      <a
                        className="mif-hero__watch-on-platform"
                        href={installationVideoWatchUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="在视频平台打开完整页面"
                      >
                        前往平台观看
                      </a>
                    ) : null}
                  </div>
                  <p className="mif-hero__frame-label">Frame 1</p>
                  <div className="mif-hero__intro" aria-label="Project introduction">
                    <p>
                      In the era of algorithms, data systems are not neutral; most are constructed using male
                      samples as the &quot;default.&quot; From car safety testing to medical diagnostic standards,
                      spanning daily life to professional fields, this bias has formed a structural Gender Data Gap.
                    </p>
                    <p>However, &quot;being seen&quot; does not equate to the acquisition of rights.</p>
                    <p>
                      In many contexts, this &quot;invisibility&quot; often carries a dual meaning: it is both a
                      passive omission caused by systemic arrogance and potentially an individual&apos;s active defense
                      of private boundaries (in an era where algorithms are all-pervasive, some people subjectively
                      refuse to be digitized or tracked).
                    </p>
                    <p>
                      This interactive prototype attempts to strike a balance between the two: it aims to expose
                      statistical omissions caused by &quot;bias,&quot; rather than seeking to revoke an
                      individual&apos;s freedom to remain &quot;hidden&quot; beyond the data.
                    </p>
                  </div>
                </section>

                <section className="mif-experience" aria-label="Standalone HTML experience">
                  <a
                    className="mif-experience__label mif-experience__label--interactive"
                    href={INSTALLATION_EXPERIENCE_HTML_PATH}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Interactive HTML
                  </a>
                  <div className="mif-experience__actions">
                    <a
                      className="mif-experience__link"
                      href={INSTALLATION_EXPERIENCE_HTML_PATH}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Open in new tab
                    </a>
                    <a
                      className="mif-experience__link mif-experience__link--outline"
                      href={INSTALLATION_EXPERIENCE_HTML_PATH}
                      download={INSTALLATION_EXPERIENCE_HTML_FILENAME}
                    >
                      Download HTML
                    </a>
                  </div>
                </section>

                <section className="mif-disc-gallery" aria-label="Process gallery">
                  <div className="mif-disc-gallery__row">
                    <div className="mif-disc-gallery__disc">
                      <DriftingImageDisc
                        images={installationDiscGallery}
                        onFrontImageChange={setInstallationDiscPreview}
                      />
                    </div>
                    <aside className="mif-disc-gallery__preview" aria-label="Preview">
                      {installationDiscPreview ? (
                        <figure className="mif-disc-gallery__figure">
                          {isDiscVideo(installationDiscPreview) ? (
                            <video
                              key={installationDiscPreview.src}
                              className="mif-disc-gallery__preview-video"
                              src={installationDiscPreview.src}
                              controls
                              playsInline
                              preload="metadata"
                              aria-label={installationDiscPreview.alt}
                            />
                          ) : (
                            <img
                              className="mif-disc-gallery__preview-img"
                              src={installationDiscPreview.src}
                              alt={installationDiscPreview.alt}
                              loading="lazy"
                              decoding="async"
                            />
                          )}
                        </figure>
                      ) : (
                        <p className="mif-disc-gallery__empty">转动圆盘时此处同步正面照片</p>
                      )}
                    </aside>
                  </div>
                </section>

                <section className="mif-installation-disclaimer" aria-label="Privacy and experience notice">
                  <ol className="mif-installation-disclaimer__list">
                    <li>
                      <strong>Purely Local Computing:</strong> Visual feature extraction (based on MediaPipe) is
                      performed exclusively within your local browser.
                    </li>
                    <li>
                      <strong>Zero Data Retention:</strong> This website does not record video, capture
                      screenshots, or upload any image data.
                    </li>
                    <li>
                      <strong>Psychological Expectation Notice:</strong> The system deliberately amplifies the
                      algorithm&apos;s crude determination of identity. Being covered by cold data reports may
                      cause a slight sense of oppression or discomfort. This is an intentional part of the
                      work&apos;s conceptual experience and is by no means an objective evaluation of your true
                      identity.
                    </li>
                  </ol>
                </section>
              </div>
            </div>,
            document.body,
          )}

        {sortedList.length > 0 ? (
          <section className="category-page__list" aria-labelledby="projects-heading-installation">
            <h2 id="projects-heading-installation" className="category-page__block-title">
              Projects in this category
            </h2>
            <ul className="category-page__projects">
              {sortedList.map((p) => (
                <li key={p.id}>
                  <Link to={`/${meta.slug}/${p.id}`} className="category-page__project-link">
                    <span className="category-page__project-id">{p.id}</span>
                    {p.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </section>
    );
  }

  const immersiveScrollReveal = meta.slug === IMMERSIVE_WORK_SLUG;

  return (
    <section
      className={
        immersiveScrollReveal
          ? "category-page category-page--immersive-scroll"
          : "category-page"
      }
    >
      <header className="category-page__head">
        <p className="category-page__kicker">Category</p>
        <h1 className="category-page__title">{meta.label}</h1>
        {meta.description.trim() ? <p className="category-page__lead">{meta.description}</p> : null}
      </header>

      <div className="category-page__placeholders">
        <ScrollReveal enabled={immersiveScrollReveal} delayMs={0}>
          <section
            className="category-page__block"
            {...(meta.slug === IMMERSIVE_WORK_SLUG ? {} : { "aria-labelledby": "embed-heading" })}
          >
            {meta.slug === IMMERSIVE_WORK_SLUG ? (
            <Link
              className="category-page__immersive-stack-link"
              to={WORK_SPATIAL_VR_PATH}
              aria-label="Immersive browsing and interaction"
            >
              <figure className="category-page__immersive-stack category-page__media">
                <div
                  className="category-page__archive-bar category-page__archive-bar--immersive-split category-page__glow-strip"
                  onMouseMove={onGlowPanelPointerMove}
                >
                  <span className="category-page__immersive-display category-page__immersive-display--archive">
                    Archive
                  </span>
                  <p className="category-page__immersive-display category-page__immersive-caption-on-image category-page__immersive-caption-on-image--vr-preview">
                    Virtual exhibition
                  </p>
                </div>
                <div className="category-page__immersive-visual">
                  <div
                    className="category-page__immersive-visual-frame category-page__glow-panel"
                    onMouseMove={onGlowPanelPointerMove}
                  >
                    <img
                      className="category-page__preview-img"
                      src="/media/immersive/01.jpg"
                      alt=""
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                </div>
              </figure>
            </Link>
          ) : (
            <>
              <h2 id="embed-heading" className="category-page__block-title">
                Video embed
              </h2>
              <p className="category-page__block-desc">
                Vimeo / YouTube URLs are resolved to an iframe by <code className="inline-code">VideoEmbed</code>.
              </p>
              <div
                className="category-page__embed-wrap category-page__glow-panel"
                onMouseMove={onGlowPanelPointerMove}
              >
                <VideoEmbed url="" title={`${meta.label} — video`} />
              </div>
            </>
          )}
          </section>
        </ScrollReveal>

        <ScrollReveal enabled={immersiveScrollReveal} delayMs={120}>
          <section className="category-page__block" aria-labelledby="scene-heading">
            {meta.slug === IMMERSIVE_WORK_SLUG ? (
              <Link
                to={DRIFTING_PAGE_PATH}
                className="category-page__immersive-stack-link"
                aria-label="Drifting — video and images"
              >
                <figure className="category-page__immersive-stack category-page__media">
                  <div
                    className="category-page__archive-bar category-page__archive-bar--immersive-split category-page__glow-strip"
                    onMouseMove={onGlowPanelPointerMove}
                  >
                    <span
                      className="category-page__immersive-display category-page__immersive-display--archive"
                      id="scene-heading"
                    >
                      Drifting
                    </span>
                    <p className="category-page__immersive-display category-page__immersive-caption-on-image category-page__immersive-caption-on-image--drifting-preview">
                      Immersive game
                    </p>
                  </div>
                  <div className="category-page__immersive-visual">
                    <div
                      className="category-page__immersive-visual-frame category-page__glow-panel"
                      onMouseMove={onGlowPanelPointerMove}
                    >
                      <Scene3DMount posterSrc="/media/immersive/02.jpg" />
                    </div>
                  </div>
                </figure>
              </Link>
            ) : (
              <figure className="category-page__immersive-stack category-page__media">
                <div
                  className="category-page__archive-bar category-page__archive-bar--immersive-split category-page__glow-strip"
                  onMouseMove={onGlowPanelPointerMove}
                >
                  <span
                    className="category-page__immersive-display category-page__immersive-display--archive"
                    id="scene-heading"
                  >
                    Drifting
                  </span>
                  <p className="category-page__immersive-display category-page__immersive-caption-on-image category-page__immersive-caption-on-image--drifting-preview">
                    Immersive game
                  </p>
                </div>
                <div className="category-page__immersive-visual">
                  <div
                    className="category-page__immersive-visual-frame category-page__glow-panel"
                    onMouseMove={onGlowPanelPointerMove}
                  >
                    <Scene3DMount posterSrc="/media/immersive/02.jpg" />
                  </div>
                </div>
              </figure>
            )}
          </section>
        </ScrollReveal>
      </div>

      {sortedList.length > 0 ? (
        <ScrollReveal enabled={immersiveScrollReveal} delayMs={220}>
          <section className="category-page__list" aria-labelledby="projects-heading">
            <h2 id="projects-heading" className="category-page__block-title">
              Projects in this category
            </h2>
            <ul className="category-page__projects">
              {sortedList.map((p) => (
                <li key={p.id}>
                  <Link to={`/${meta.slug}/${p.id}`} className="category-page__project-link">
                    <span className="category-page__project-id">{p.id}</span>
                    {p.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </ScrollReveal>
      ) : null}
    </section>
  );
}
