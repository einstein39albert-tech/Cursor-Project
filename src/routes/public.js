const express = require("express");
const { getOverviewStats, getOrganizationSettings } = require("../services/dashboardService");

const router = express.Router();

router.get("/", (req, res) => {
  res.render("public/home", {
    pageTitle: res.locals.t("nav.home"),
    stats: getOverviewStats(),
    organization: getOrganizationSettings(),
  });
});

router.get("/contact", (req, res) => {
  res.render("public/contact", {
    pageTitle: res.locals.t("nav.contact"),
    organization: getOrganizationSettings(),
  });
});

router.get("/features", (req, res) => {
  res.render("public/features", {
    pageTitle: res.locals.t("nav.features"),
  });
});

module.exports = router;
