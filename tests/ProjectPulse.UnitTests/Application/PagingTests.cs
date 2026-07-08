using FluentAssertions;
using ProjectPulse.Application.Common.Models;

namespace ProjectPulse.UnitTests.Application;

public class PagingTests
{
    [Fact]
    public void Clamp_Applies_Defaults_When_Missing()
    {
        var (page, pageSize) = Paging.Clamp(null, null);
        page.Should().Be(1);
        pageSize.Should().Be(Paging.DefaultPageSize);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-5)]
    public void Clamp_Raises_Page_To_One(int requestedPage)
    {
        var (page, _) = Paging.Clamp(requestedPage, 10);
        page.Should().Be(1);
    }

    [Fact]
    public void Clamp_Caps_PageSize_At_Max()
    {
        var (_, pageSize) = Paging.Clamp(1, 5000);
        pageSize.Should().Be(Paging.MaxPageSize);
    }

    [Fact]
    public void Clamp_Replaces_NonPositive_PageSize_With_Default()
    {
        var (_, pageSize) = Paging.Clamp(1, 0);
        pageSize.Should().Be(Paging.DefaultPageSize);
    }

    [Fact]
    public void Clamp_Honors_Custom_Default_And_Max()
    {
        var (_, pageSize) = Paging.Clamp(1, 999, defaultPageSize: 50, maxPageSize: 200);
        pageSize.Should().Be(200);
    }

    [Fact]
    public void PagedResult_Computes_TotalPages_And_HasNextPage()
    {
        var result = new PagedResult<int>([1, 2, 3], TotalCount: 45, Page: 1, PageSize: 20);
        result.TotalPages.Should().Be(3);
        result.HasNextPage.Should().BeTrue();

        var lastPage = new PagedResult<int>([1], TotalCount: 45, Page: 3, PageSize: 20);
        lastPage.HasNextPage.Should().BeFalse();
    }
}
